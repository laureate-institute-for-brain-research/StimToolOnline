// Finds cloud credentials compiled into Unity WebGL builds (CWE-798), and keeps the
// server from publishing them.
//
// A Unity WebGL `.data` file is a "UnityWebData1.0" container. One of its entries is
// Il2CppData/Metadata/global-metadata.dat, whose string-literal table holds every C#
// string literal in the game, so a key written in a script ends up readable by anyone
// who downloads the build. This module:
//   - parses the container and the string-literal table and reports any literal that
//     looks like an AWS access key id (AKIA/ASIA...) or an AWS secret access key
//     (40 chars of base64 alphabet with mixed case and digits);
//   - also scans the raw bytes of every file for access-key-id patterns, as a backstop
//     for unknown metadata versions or non-Unity files;
//   - decompresses gzip/brotli builds (.data.gz, .data.br, .unityweb) first;
//   - provides createPublicSecretsGuard(), mounted before express.static, which refuses
//     to serve a Unity game whose build contains credentials and never serves
//     Somatomap participant output files.
//
// Findings are always masked: the first four characters, the length and a short sha256
// fingerprint (to tell keys apart). Neither the CLI nor the guard prints a secret.
//
//   node unitybuildscan.js <file-or-directory> [...]   exit code 1 if anything is found
//   node unitybuildscan.js --show-key-ids <file>       also print access key *ids* in full,
//                                                     so the account owner can find the key
//                                                     in IAM. Secret keys are never printed.

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const crypto = require('crypto')

const WEBDATA_MAGIC = 'UnityWebData1.0\0'
const METADATA_SANITY = 0xFAB11BAF
const METADATA_NAME = 'Il2CppData/Metadata/global-metadata.dat'

// AWS access key ids: AKIA = long-term IAM user key, ASIA = temporary STS key.
const ACCESS_KEY_ID_RE = /^(?:AKIA|ASIA)[A-Z0-9]{16}$/
// No boundary check after the 16 chars: IL2CPP stores literals back to back, so a key
// is often followed directly by the next literal's first letter.
const ACCESS_KEY_ID_SCAN_RE = /(?:AKIA|ASIA)[A-Z0-9]{16}/g
// AWS secret access keys: 40 chars from the base64 alphabet. Requiring all three of
// upper, lower and digit keeps ordinary 40-char words and paths out.
const SECRET_KEY_RE = /^[A-Za-z0-9/+]{40}$/

// Raw pixel/audio bytes match the access-key-id pattern by chance, so directory walks
// skip media. Pass a media file explicitly to scan it anyway.
const MEDIA_EXT = new Set(['.bmp', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.tif', '.tiff',
  '.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm', '.mov', '.avi', '.ttf', '.otf', '.woff', '.woff2', '.eot'])

const BUILD_DATA_RE = /\.(?:data|data\.gz|data\.br|unityweb)$/i
const OUTPUT_DATA_RE = /_somatomap_outputdata\.txt$/i

// Masked value plus a short sha256 fingerprint, so the same key can be recognised across
// files and builds without the key itself ever being printed.
function mask (value) {
  const fp = crypto.createHash('sha256').update(value).digest('hex').slice(0, 12)
  return `${value.slice(0, 4)}${'*'.repeat(Math.max(0, value.length - 4))} (len ${value.length}, sha256:${fp})`
}

function looksLikeSecretKey (s) {
  return SECRET_KEY_RE.test(s) && /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s)
}

function classifyLiteral (s) {
  if (ACCESS_KEY_ID_RE.test(s)) return 'aws-access-key-id'
  if (looksLikeSecretKey(s)) return 'aws-secret-access-key-shape'
  return null
}

// Returns [{ name, offset, size }] for a UnityWebData1.0 buffer, or null if it is not one.
function parseUnityWebData (buf) {
  if (buf.length < 20 || buf.toString('latin1', 0, 16) !== WEBDATA_MAGIC) return null
  const headerEnd = buf.readUInt32LE(16)
  if (headerEnd > buf.length) throw new Error('UnityWebData header runs past end of file')
  const entries = []
  let p = 20
  while (p < headerEnd) {
    if (p + 12 > headerEnd) throw new Error('truncated UnityWebData entry header')
    const offset = buf.readUInt32LE(p)
    const size = buf.readUInt32LE(p + 4)
    const nameLen = buf.readUInt32LE(p + 8)
    p += 12
    if (p + nameLen > headerEnd) throw new Error('truncated UnityWebData entry name')
    const name = buf.toString('utf8', p, p + nameLen)
    p += nameLen
    if (offset + size > buf.length) throw new Error(`UnityWebData entry ${name} runs past end of file`)
    entries.push({ name, offset, size })
  }
  return entries
}

// Returns the string-literal table of an IL2CPP global-metadata.dat buffer as an array
// of strings (index = literal number). Supports metadata versions 24-31 (Unity 2018.3 to
// 2023), whose header starts with stringLiteral{Offset,Size} and stringLiteralData{Offset,
// Size} and whose literal entries are { uint32 length, int32 dataIndex }.
// Throws for anything else, so callers notice instead of silently passing.
function parseIl2CppStringLiterals (meta) {
  if (meta.length < 24 || meta.readUInt32LE(0) !== METADATA_SANITY) {
    throw new Error('not an IL2CPP global-metadata.dat (bad sanity value)')
  }
  const version = meta.readInt32LE(4)
  if (version < 24 || version > 31) {
    throw new Error(`unsupported IL2CPP metadata version ${version}`)
  }
  const tableOffset = meta.readUInt32LE(8)
  const tableSize = meta.readUInt32LE(12)
  const dataOffset = meta.readUInt32LE(16)
  const dataSize = meta.readUInt32LE(20)
  if (tableOffset + tableSize > meta.length || dataOffset + dataSize > meta.length || tableSize % 8 !== 0) {
    throw new Error('IL2CPP string-literal table out of bounds')
  }
  const literals = []
  for (let p = tableOffset; p < tableOffset + tableSize; p += 8) {
    const length = meta.readUInt32LE(p)
    const index = meta.readInt32LE(p + 4)
    if (index < 0 || index + length > dataSize) throw new Error('IL2CPP string literal out of bounds')
    literals.push(meta.toString('utf8', dataOffset + index, dataOffset + index + length))
  }
  return { version, literals }
}

// Raw-bytes backstop: access key ids anywhere in the buffer.
function scanRaw (buf, opts) {
  const text = buf.toString('latin1')
  const hits = []
  ACCESS_KEY_ID_SCAN_RE.lastIndex = 0
  let m
  while ((m = ACCESS_KEY_ID_SCAN_RE.exec(text)) !== null) {
    hits.push(finding('aws-access-key-id', `byte ${m.index}`, m[0], opts))
  }
  return hits
}

function finding (kind, where, value, opts = {}) {
  const f = { kind, where, masked: mask(value) }
  // Access key ids identify a key but cannot sign requests; the secret is never exposed.
  if (opts.showKeyIds && kind === 'aws-access-key-id') f.keyId = value
  return f
}

// Scans one (already decompressed) buffer.
// Returns { findings, literalCount, metadataVersion, isUnityWebData }.
function scanBuffer (buf, opts = {}) {
  const findings = scanRaw(buf, opts)
  const result = { findings, literalCount: null, metadataVersion: null, isUnityWebData: false }
  let entries
  try {
    entries = parseUnityWebData(buf)
  } catch (err) {
    findings.push({ kind: 'unparsed', where: 'UnityWebData container', masked: err.message })
    return result
  }
  if (!entries) return result
  result.isUnityWebData = true
  const metaEntry = entries.find((e) => e.name === METADATA_NAME)
  if (!metaEntry) {
    findings.push({ kind: 'unparsed', where: METADATA_NAME, masked: 'metadata entry missing; string literals not checked' })
    return result
  }
  const meta = buf.subarray(metaEntry.offset, metaEntry.offset + metaEntry.size)
  try {
    const { version, literals } = parseIl2CppStringLiterals(meta)
    result.metadataVersion = version
    result.literalCount = literals.length
    literals.forEach((s, i) => {
      const kind = classifyLiteral(s)
      if (kind) findings.push(finding(kind, `string literal #${i}`, s, opts))
    })
  } catch (err) {
    findings.push({ kind: 'unparsed', where: METADATA_NAME, masked: err.message })
  }
  return result
}

// Reads a file, undoing Unity's gzip or brotli build compression when present.
function readBuildFile (file) {
  const buf = fs.readFileSync(file)
  const name = file.toLowerCase()
  const gzip = buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b
  try {
    if (gzip && (name.endsWith('.gz') || name.endsWith('.unityweb'))) return zlib.gunzipSync(buf)
    if (name.endsWith('.br')) return zlib.brotliDecompressSync(buf)
    if (name.endsWith('.unityweb') && !buf.toString('latin1', 0, 16).startsWith('UnityWebData')) {
      return zlib.brotliDecompressSync(buf)
    }
  } catch (err) {
    // Not actually compressed: scan the bytes as they are.
  }
  return buf
}

function scanFile (file, opts) {
  return scanBuffer(readBuildFile(file), opts)
}

function listFiles (target) {
  const stat = fs.statSync(target)
  if (!stat.isDirectory()) return [target]
  const out = []
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const p = path.join(target, entry.name)
    if (entry.isDirectory()) out.push(...listFiles(p))
    else if (entry.isFile() && !MEDIA_EXT.has(path.extname(entry.name).toLowerCase())) out.push(p)
  }
  return out.sort()
}

// Scans files and directories. Returns [{ file, ...scanBuffer result }] for every file
// that has findings.
function scanPaths (targets, opts) {
  const reports = []
  for (const target of targets) {
    for (const file of listFiles(target)) {
      const r = scanFile(file, opts)
      if (r.findings.length) reports.push({ file, ...r })
    }
  }
  return reports
}

// Express middleware for the static tree. At startup it scans every Unity build under
// <publicDir>/unity/<game>/; a game whose build contains a credential is not served at
// all (404), so a compromised build that is copied back in stays unreachable. Somatomap
// participant output files are never served from anywhere in the tree: results are
// written server-side by save.php and must not be readable over HTTP.
function createPublicSecretsGuard (publicDir, log = console) {
  const unityRoot = path.join(path.resolve(publicDir), 'unity')
  const blocked = []
  let games = []
  try {
    games = fs.readdirSync(unityRoot, { withFileTypes: true }).filter((d) => d.isDirectory())
  } catch (err) {
    // No Unity games: nothing to scan.
  }
  for (const game of games) {
    const builds = listFiles(path.join(unityRoot, game.name)).filter((f) => BUILD_DATA_RE.test(f))
    for (const file of builds) {
      const { findings } = scanFile(file)
      const creds = findings.filter((f) => f.kind !== 'unparsed')
      if (creds.length) {
        blocked.push(`/unity/${game.name}/`.toLowerCase())
        log.error(`${file}: ${creds.length} credential-shaped value(s) compiled into the build ` +
          `(${creds.map((f) => `${f.kind} ${f.masked}`).join('; ')}). Not serving /unity/${game.name}/.`)
        break
      }
      if (findings.length) log.warn(`${file}: could not fully check build for credentials: ${findings[0].masked}`)
    }
  }

  return function publicSecretsGuard (req, res, next) {
    let p
    try {
      p = decodeURIComponent(req.path)
    } catch (err) {
      return next() // express.static rejects malformed paths itself
    }
    p = path.posix.normalize(p.replace(/\\/g, '/')).toLowerCase()
    if (OUTPUT_DATA_RE.test(p) || blocked.some((prefix) => p.startsWith(prefix))) {
      return res.status(404).send('Not found')
    }
    next()
  }
}

module.exports = {
  scanBuffer,
  scanFile,
  scanPaths,
  readBuildFile,
  parseUnityWebData,
  parseIl2CppStringLiterals,
  classifyLiteral,
  createPublicSecretsGuard,
  mask,
  METADATA_NAME
}

if (require.main === module) {
  const args = process.argv.slice(2)
  const showKeyIds = args.includes('--show-key-ids')
  const targets = args.filter((a) => a !== '--show-key-ids')
  if (!targets.length) {
    console.error('usage: node unitybuildscan.js [--show-key-ids] <file-or-directory> [...]')
    process.exit(2)
  }
  const reports = scanPaths(targets, { showKeyIds })
  for (const r of reports) {
    console.log(`${r.file}${r.metadataVersion !== null ? ` (IL2CPP metadata v${r.metadataVersion}, ${r.literalCount} literals)` : ''}`)
    for (const f of r.findings) console.log(`  ${f.kind}  ${f.where}  ${f.keyId || f.masked}`)
  }
  console.log(reports.length ? `${reports.length} file(s) with findings` : 'no credentials found')
  process.exit(reports.length ? 1 : 0)
}
