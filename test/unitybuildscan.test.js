// Regression tests for credentials compiled into publicly served Unity builds (CWE-798):
// the Somatomap WebGL build carried an AWS key pair in its IL2CPP string literals and was
// served to anyone by express.static('public').
//
// Every credential below is synthetic and assembled at run time, so no key-shaped string
// appears in this file. Synthetic builds live in a fresh temp directory.
//
//   npm test

const test = require('tape')
const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')
const zlib = require('zlib')

process.env.LOG_LEVEL = 'silent'

const express = require('express')
const {
  scanBuffer, scanFile, scanPaths, parseUnityWebData, parseIl2CppStringLiterals,
  createPublicSecretsGuard, METADATA_NAME
} = require('../unitybuildscan')

const REPO = path.join(__dirname, '..')
const FAKE_KEY_ID = ['AK', 'IA', 'SYNTHETICTEST123'].join('') // 20 chars, access-key-id shape
const FAKE_SECRET = 'Synthetic0'.repeat(4) // 40 chars, secret-access-key shape

// global-metadata.dat (v24-31 layout) holding `literals` in its string-literal table.
// Literal bytes are stored back to back, as IL2CPP does.
function metadata (literals, version = 29) {
  const data = Buffer.concat(literals.map((s) => Buffer.from(s, 'utf8')))
  const tableOffset = 64
  const tableSize = literals.length * 8
  const dataOffset = tableOffset + tableSize
  const buf = Buffer.alloc(dataOffset + data.length)
  buf.writeUInt32LE(0xFAB11BAF, 0)
  buf.writeInt32LE(version, 4)
  buf.writeUInt32LE(tableOffset, 8)
  buf.writeUInt32LE(tableSize, 12)
  buf.writeUInt32LE(dataOffset, 16)
  buf.writeUInt32LE(data.length, 20)
  let index = 0
  literals.forEach((s, i) => {
    const len = Buffer.byteLength(s, 'utf8')
    buf.writeUInt32LE(len, tableOffset + i * 8)
    buf.writeInt32LE(index, tableOffset + i * 8 + 4)
    index += len
  })
  data.copy(buf, dataOffset)
  return buf
}

// UnityWebData1.0 container with the given { name: Buffer } entries.
function webData (files) {
  const names = Object.keys(files)
  const headerLen = 20 + names.reduce((n, name) => n + 12 + Buffer.byteLength(name), 0)
  const parts = [Buffer.from('UnityWebData1.0\0', 'latin1')]
  const len = Buffer.alloc(4)
  len.writeUInt32LE(headerLen)
  parts.push(len)
  let offset = headerLen
  for (const name of names) {
    const e = Buffer.alloc(12)
    e.writeUInt32LE(offset, 0)
    e.writeUInt32LE(files[name].length, 4)
    e.writeUInt32LE(Buffer.byteLength(name), 8)
    parts.push(e, Buffer.from(name, 'utf8'))
    offset += files[name].length
  }
  return Buffer.concat([...parts, ...names.map((n) => files[n])])
}

const CLEAN_LITERALS = ['Bucket', 'synthetic-bucket', '_somatomap_outputdata.txt', 'redcap.txt', 'Hello world', 'a'.repeat(40)]
const cleanBuild = () => webData({
  'data.unity3d': Buffer.from('synthetic scene data'),
  [METADATA_NAME]: metadata(CLEAN_LITERALS)
})
// The key id is followed directly by a literal starting with an upper-case letter, so the
// raw-bytes backstop must not require a boundary after the 20 chars.
const keyedBuild = (version = 29) => webData({
  'data.unity3d': Buffer.from('synthetic scene data'),
  [METADATA_NAME]: metadata(['Bucket', FAKE_KEY_ID, 'Xnext', 'synthetic-bucket', FAKE_SECRET, 'tail'], version)
})

const leaks = (value) => [FAKE_KEY_ID, FAKE_SECRET].some((s) => JSON.stringify(value).includes(s))

test('parses the UnityWebData container and the IL2CPP string-literal table', (t) => {
  const buf = cleanBuild()
  const entries = parseUnityWebData(buf)
  t.deepEqual(entries.map((e) => e.name), ['data.unity3d', METADATA_NAME])
  const meta = entries[1]
  const { version, literals } = parseIl2CppStringLiterals(buf.subarray(meta.offset, meta.offset + meta.size))
  t.equal(version, 29)
  t.deepEqual(literals, CLEAN_LITERALS)
  t.equal(parseUnityWebData(Buffer.from('not a unity build')), null)
  t.end()
})

test('a clean build has no findings', (t) => {
  const r = scanBuffer(cleanBuild())
  t.ok(r.isUnityWebData)
  t.equal(r.literalCount, CLEAN_LITERALS.length)
  t.deepEqual(r.findings, [])
  t.end()
})

test('finds an access key id and a secret-shaped literal, and never reveals them', (t) => {
  const r = scanBuffer(keyedBuild())
  const kinds = r.findings.map((f) => `${f.kind}@${f.where}`)
  t.ok(kinds.includes('aws-access-key-id@string literal #1'), 'key id found in literal table')
  t.ok(kinds.includes('aws-secret-access-key-shape@string literal #4'), 'secret found in literal table')
  t.ok(r.findings.some((f) => f.kind === 'aws-access-key-id' && f.where.startsWith('byte ')), 'raw-bytes backstop finds the key id too')
  t.notOk(leaks(r), 'report is masked')
  t.ok(r.findings.every((f) => /sha256:[0-9a-f]{12}/.test(f.masked)), 'fingerprint lets keys be compared')

  const shown = scanBuffer(keyedBuild(), { showKeyIds: true })
  t.ok(shown.findings.some((f) => f.keyId === FAKE_KEY_ID), '--show-key-ids reveals the key id')
  t.notOk(JSON.stringify(shown).includes(FAKE_SECRET), '--show-key-ids never reveals the secret')
  t.end()
})

test('unsupported metadata or a broken container is reported, not silently passed', (t) => {
  const r = scanBuffer(keyedBuild(99))
  t.ok(r.findings.some((f) => f.kind === 'unparsed'), 'unknown metadata version reported')
  t.ok(r.findings.some((f) => f.kind === 'aws-access-key-id'), 'raw backstop still finds the key id')

  const truncated = cleanBuild().subarray(0, 40)
  t.ok(scanBuffer(truncated).findings.some((f) => f.kind === 'unparsed'), 'truncated container reported')
  t.end()
})

test('gzip and brotli compressed builds are decompressed and checked', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unityscan-test-'))
  const files = {
    'b.data.gz': zlib.gzipSync(keyedBuild()),
    'b.data.br': zlib.brotliCompressSync(keyedBuild()),
    'b.unityweb': zlib.gzipSync(keyedBuild()),
    'c.data.gz': zlib.gzipSync(cleanBuild())
  }
  for (const [name, buf] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), buf)
  for (const name of ['b.data.gz', 'b.data.br', 'b.unityweb']) {
    const r = scanFile(path.join(dir, name))
    t.ok(r.findings.some((f) => f.where === 'string literal #4'), `${name}: secret found after decompression`)
  }
  t.deepEqual(scanFile(path.join(dir, 'c.data.gz')).findings, [], 'clean compressed build passes')
  fs.rmSync(dir, { recursive: true, force: true })
  t.end()
})

// Fails before the fix: SomatomapLaureate_WebApp_v13.data had an access key id (literal
// #1866) and a secret-shaped literal (#11969), and was served from public/.
test('nothing under public/ (the static tree) contains a credential', (t) => {
  const reports = scanPaths([path.join(REPO, 'public')])
  t.deepEqual(reports.map((r) => `${path.relative(REPO, r.file)}: ${r.findings.map((f) => `${f.kind} ${f.where}`).join(', ')}`), [])
  t.end()
})

// Fails before the fix: ten *_somatomap_outputdata.txt files were in StreamingAssets.
test('no Somatomap participant output file is in the static tree', (t) => {
  const found = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/_somatomap_outputdata\.txt$/i.test(e.name)) found.push(path.relative(REPO, p))
    }
  }
  walk(path.join(REPO, 'public'))
  t.deepEqual(found, [])
  t.end()
})

test('somatomap.html does not load a removed, credential-bearing build', (t) => {
  const html = fs.readFileSync(path.join(REPO, 'public', 'somatomap.html'), 'utf8')
  for (const v of ['v6', 'v8', 'v13']) t.notOk(html.includes(`SomatomapLaureate_WebApp_${v}.`), `${v} not referenced`)
  t.end()
})

// --- createPublicSecretsGuard ---------------------------------------------------------

function get (server, route) {
  const { port } = server.address()
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: route }, (res) => {
      res.resume()
      res.on('end', () => resolve(res.statusCode))
    }).on('error', reject)
  })
}

test('the server refuses to serve a game whose build has a credential, and never serves output files', async (t) => {
  const pub = fs.mkdtempSync(path.join(os.tmpdir(), 'unityguard-test-'))
  const put = (rel, buf) => {
    fs.mkdirSync(path.dirname(path.join(pub, rel)), { recursive: true })
    fs.writeFileSync(path.join(pub, rel), buf)
  }
  put('unity/bad/Build/Bad.data', keyedBuild())
  put('unity/bad/Build/Bad.loader.js', 'synthetic loader')
  put('unity/badgz/Build/Bad.data.gz', zlib.gzipSync(keyedBuild()))
  put('unity/good/Build/Good.data', cleanBuild())
  put('unity/good/StreamingAssets/SYN001_CURRENT_1700000000.1_somatomap_outputdata.txt', 'synthetic output')
  put('SYN002_CURRENT_1700000000.2_somatomap_outputdata.txt', 'synthetic output')
  put('index.html', '<p>synthetic</p>')

  const logged = []
  const log = { error: (m) => logged.push(m), warn: (m) => logged.push(m) }
  const app = express()
  app.use(createPublicSecretsGuard(pub, log))
  app.use(express.static(pub))
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })

  const blocked = [
    '/unity/bad/Build/Bad.data',
    '/unity/bad/Build/Bad.loader.js',
    '/unity/BAD/Build/Bad.data',
    '/unity/./bad/Build/Bad.data',
    '/unity//bad/Build/Bad.data',
    '/unity/%62ad/Build/Bad.data',
    '/unity/good/../bad/Build/Bad.data',
    '/unity/badgz/Build/Bad.data.gz',
    '/unity/good/StreamingAssets/SYN001_CURRENT_1700000000.1_somatomap_outputdata.txt',
    '/unity/good/StreamingAssets/SYN001_CURRENT_1700000000.1_SOMATOMAP_OUTPUTDATA.TXT',
    '/SYN002_CURRENT_1700000000.2_somatomap_outputdata.txt',
    '/SYN002_CURRENT_1700000000.2_somatomap_outputdata%2etxt'
  ]
  for (const route of blocked) t.notEqual(await get(server, route), 200, `${route} not served`)
  t.equal(await get(server, '/unity/good/Build/Good.data'), 200, 'clean build still served')
  t.equal(await get(server, '/index.html'), 200, 'other static files still served')

  t.ok(logged.some((m) => m.includes('Bad.data') && m.includes('/unity/bad/')), 'blocked build is logged')
  t.notOk(leaks(logged), 'log is masked')

  server.close()
  fs.rmSync(pub, { recursive: true, force: true })
  t.end()
})
