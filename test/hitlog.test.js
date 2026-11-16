// Regression tests for POST /SaveHitCSV, /logStuff and /SaveDevInfo (CWE-73).
// Runs the real routes from stimtoolapi.js on a local, throwaway Express app.
// All data is synthetic and every file lives in a fresh temp directory.
//
//   npm test

const test = require('tape')
const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')
const crypto = require('crypto')

const APP_ROOT = path.resolve(__dirname, '..')
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'hitlog-test-'))
const logDir = path.join(scratch, 'hit_codes')
const dataDir = path.join(scratch, 'data')
const victimDir = path.join(scratch, 'victim')
fs.mkdirSync(logDir)
fs.mkdirSync(dataDir)
fs.mkdirSync(victimDir)

// Configure before stimtoolapi.js is loaded
process.env.HIT_LOG_DIR = logDir
process.env.DATA_PATH = dataDir
process.env.KEYS_PATH = path.join(scratch, 'no-keys.json')
process.env.LOG_LEVEL = 'silent'

const express = require('express')
const bodyParser = require('body-parser')
const expressSanitizer = require('express-sanitizer')
const { registerHitLogRoutes, resolveLogDir, MAX_FIELD_LENGTH } = require('../hitlog')

function buildApp (register) {
  const app = express()
  app.use(bodyParser.urlencoded({ extended: true, parameterLimit: 1000000, limit: '100mb' }))
  app.use(bodyParser.json({ limit: '100mb' }))
  app.use(expressSanitizer())
  register(app)
  return app
}

function listen (app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function post (server, route, body, asJson) {
  const payload = asJson ? JSON.stringify(body) : new URLSearchParams(body).toString()
  const { port } = server.address()
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: route,
      method: 'POST',
      headers: {
        'Content-Type': asJson ? 'application/json' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let text = ''
      res.on('data', (c) => { text += c })
      res.on('end', () => resolve({ status: res.statusCode, text }))
    })
    req.on('error', reject)
    req.end(payload)
  })
}

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null)
const logFile = (name) => path.join(logDir, name)
const unique = (prefix) => `${prefix}-${crypto.randomBytes(6).toString('hex')}`
function resetLogs () {
  for (const f of fs.readdirSync(logDir)) fs.unlinkSync(path.join(logDir, f))
}

let server
// Files the old, vulnerable handlers would have created inside the repo; removed at the end.
const repoTargets = []

test('setup', async (t) => {
  // Load the real stimtoolapi.js routes (models are constructed but no DB connection is made)
  server = await listen(buildApp((app) => require('../stimtoolapi.js')(app)))
  t.end()
})

test('each route appends to its fixed file in HIT_LOG_DIR', async (t) => {
  resetLogs()
  let r = await post(server, '/SaveHitCSV', { content: 'TESTCODE42' })
  t.equal(r.status, 200)
  r = await post(server, '/logStuff', { content: 'SYNTH01:  !!! skip pressed in index !!! - 1700000000000' })
  t.equal(r.status, 200)
  r = await post(server, '/SaveDevInfo', { username: 'SYNTH01', dimensions: 'Width-1 + Height-2', content: 'Mozilla/5.0 (X11, Linux) Test' })
  t.equal(r.status, 200)

  t.equal(read(logFile('hit_codes.csv')), 'TESTCODE42,')
  t.equal(read(logFile('custom_log.csv')), 'SYNTH01:  !!! skip pressed in index !!! - 1700000000000,')
  t.equal(read(logFile('device_info.csv')), 'user: SYNTH01 ::: Width-1 + Height-2 ::: Mozilla/5.0 (X11  Linux) Test,')
  t.end()
})

test('request-supplied csvpath never chooses the file', async (t) => {
  resetLogs()
  const existingVictim = path.join(victimDir, 'existing.csv')
  fs.writeFileSync(existingVictim, 'original\n')

  const publicTarget = path.join(APP_ROOT, 'public', unique('pwned') + '.js')
  const rootTarget = path.join(APP_ROOT, unique('pwned') + '.js')
  const modelsTarget = path.join(APP_ROOT, 'models', unique('pwned') + '.js')
  const studyTarget = path.join(APP_ROOT, 'public', 'study', unique('pwned') + '.json.js')
  const tmpTarget = path.join(os.tmpdir(), unique('pwned') + '.txt')
  const dataTarget = path.join(dataDir, unique('pwned') + '.csv')
  const relativeTarget = path.relative(process.cwd(), path.join(victimDir, unique('rel') + '.csv'))
  const dotdotTarget = path.join(logDir, '..', 'victim', unique('dotdot') + '.csv')
  repoTargets.push(publicTarget, rootTarget, modelsTarget, studyTarget, tmpTarget)

  const created = [publicTarget, rootTarget, modelsTarget, studyTarget, tmpTarget, dataTarget,
    path.resolve(relativeTarget), dotdotTarget]
  const attempts = [existingVictim, ...created.slice(0, -2), relativeTarget, dotdotTarget]

  let n = 0
  for (const csvpath of attempts) {
    for (const route of ['/SaveHitCSV', '/logStuff', '/SaveDevInfo']) {
      const r = await post(server, route, { csvpath, content: 'module.exports=1//', username: 'u', dimensions: 'd' })
      t.equal(r.status, 200, `${route} accepted with csvpath ${csvpath}`)
      n++
    }
  }
  // Non-string csvpath values (fd numbers, arrays, objects) are ignored too
  for (const csvpath of [1, 2, [existingVictim], { path: existingVictim }]) {
    const r = await post(server, '/SaveHitCSV', { csvpath, content: 'FDTEST' }, true)
    t.equal(r.status, 200, `non-string csvpath ${JSON.stringify(csvpath)} ignored`)
  }

  t.equal(read(existingVictim), 'original\n', 'existing file outside HIT_LOG_DIR untouched')
  for (const p of created) t.notOk(fs.existsSync(p), `no file created at ${p}`)

  const hits = read(logFile('hit_codes.csv'))
  t.equal(hits.split(',').filter((s) => s === 'module.exports=1//').length, n / 3, 'every write landed in hit_codes.csv')
  t.equal(hits.split(',').filter((s) => s === 'FDTEST').length, 4)
  t.deepEqual(fs.readdirSync(logDir).sort(), ['custom_log.csv', 'device_info.csv', 'hit_codes.csv'],
    'only the three fixed files exist in HIT_LOG_DIR')
  t.end()
})

test('line breaks and delimiters cannot forge extra entries; length is bounded', async (t) => {
  resetLogs()
  const LS = String.fromCharCode(0x2028) // Unicode line separator
  await post(server, '/SaveHitCSV', { content: 'AAA\nBBB,\r\nFORGED1,FORGED2' + LS + 'X' })
  await post(server, '/SaveDevInfo', { username: 'u\nuser: forged', dimensions: 'd\r\n', content: 'ua,ua' })
  await post(server, '/logStuff', { content: 'Z'.repeat(MAX_FIELD_LENGTH * 4) })

  const hits = read(logFile('hit_codes.csv'))
  t.equal(hits, 'AAA BBB  FORGED1 FORGED2 X,')
  t.notOk(/[\r\n]/.test(hits))
  t.equal(hits.split(',').length - 1, 1, 'one request, one entry')

  const dev = read(logFile('device_info.csv'))
  t.notOk(/[\r\n]/.test(dev))
  t.equal(dev.split(',').length - 1, 1)

  t.equal(read(logFile('custom_log.csv')).length, MAX_FIELD_LENGTH + 1)
  t.end()
})

test('non-string or empty content is rejected and nothing is written', async (t) => {
  resetLogs()
  for (const content of [123, ['a', 'b'], { a: 'b' }, true]) {
    const r = await post(server, '/SaveHitCSV', { content }, true)
    t.equal(r.status, 400, `content ${JSON.stringify(content)} rejected`)
  }
  t.equal((await post(server, '/logStuff', {})).status, 400, 'missing content rejected')
  t.equal((await post(server, '/SaveDevInfo', { username: ['x'] }, true)).status, 400)
  t.deepEqual(fs.readdirSync(logDir), [])
  t.end()
})

test('HIT_LOG_DIR inside the application directory is refused', async (t) => {
  t.equal(resolveLogDir(path.join(APP_ROOT, 'public')), null)
  t.equal(resolveLogDir(path.join(APP_ROOT, 'public', 'HIT_CODES')), null)
  t.equal(resolveLogDir(APP_ROOT), null)
  t.equal(resolveLogDir(path.join(APP_ROOT, 'models')), null)
  t.equal(resolveLogDir(logDir), logDir)
  t.equal(resolveLogDir(path.join(APP_ROOT, '..', path.basename(APP_ROOT) + '-logs')),
    path.join(path.dirname(APP_ROOT), path.basename(APP_ROOT) + '-logs'), 'sibling directory allowed')

  const badDir = path.join(APP_ROOT, 'public')
  const before = fs.readdirSync(badDir).sort()
  const s = await listen(buildApp((app) => registerHitLogRoutes(app, { logDir: badDir })))
  const r = await post(s, '/SaveHitCSV', { content: 'X' })
  s.close()
  t.equal(r.status, 503)
  t.deepEqual(fs.readdirSync(badDir).sort(), before, 'public/ unchanged')
  t.end()
})

test('teardown', (t) => {
  server.close()
  for (const p of repoTargets) if (fs.existsSync(p)) fs.unlinkSync(p)
  fs.rmSync(scratch, { recursive: true, force: true })
  t.end()
})
