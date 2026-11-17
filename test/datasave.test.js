// Regression tests for POST /savecoop, /save and /saveAudio (CWE-22 path traversal and
// silent overwrite of result files). All data is synthetic and every file lives in a
// fresh temp directory.
//
//   npm test

const test = require('tape')
const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')
const crypto = require('crypto')

process.env.LOG_LEVEL = 'silent'

const express = require('express')
const bodyParser = require('body-parser')
const expressSanitizer = require('express-sanitizer')
const { registerDataSaveRoutes, safeComponent, resolveStudyDir, COMPONENT_MAX } = require('../datasave')

// scratch/
//   data/STUDY_A/        valid study directory
//   data/STUDY_A/nested/ exists, but is not directly under the data root
//   free/                fallback directory
//   outside/             must never be written by any request
const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'datasave-test-')))
const dataRoot = path.join(scratch, 'data')
const studyDir = path.join(dataRoot, 'STUDY_A')
const nestedDir = path.join(studyDir, 'nested')
const fallbackDir = path.join(scratch, 'free')
const outsideDir = path.join(scratch, 'outside')
for (const d of [dataRoot, studyDir, nestedDir, fallbackDir, outsideDir]) fs.mkdirSync(d, { recursive: true })

const DATE = '2026-11-17_14h05.33.123' // psychojs MonotonicClock.getDateStr() format
const TRIALS = [{ trial: 1, response: 'SYNTH_LEFT' }, { trial: 2, response: 'SYNTH_RIGHT' }]
const token = () => crypto.randomBytes(16).toString('hex')
const unique = (prefix) => `${prefix}-${crypto.randomBytes(6).toString('hex')}`
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function coopInfo (overrides = {}) {
  return { participant: 'SYN001', session: 'T1', run_id: 'Pilot_R1_NEW.json', date: DATE, study: 'STUDY_A', ...overrides }
}

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

function post (server, route, body) {
  const payload = JSON.stringify(body)
  const { port } = server.address()
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: route,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let text = ''
      res.on('data', (c) => { text += c })
      res.on('end', () => resolve({ status: res.statusCode, text }))
    })
    req.on('error', reject)
    req.end(payload)
  })
}

// Every file under dir, as absolute paths
function walk (dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out.sort()
}

// Path -> content for every file in scratch, so "nothing changed" can be asserted exactly
function snapshot () {
  const snap = {}
  for (const f of walk(scratch)) snap[f] = fs.readFileSync(f, 'base64')
  return snap
}

function clearResults () {
  for (const dir of [studyDir, fallbackDir]) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f)
      if (fs.statSync(p).isFile()) fs.unlinkSync(p)
    }
  }
}

const results = (dir) => fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile()).sort()

// Files created by the request batch: anything new, anywhere under scratch
function created (before) {
  return Object.keys(snapshot()).filter((f) => !(f in before))
}

const TRAVERSALS = [
  '../outside',
  '../../outside',
  '..\\..\\outside',
  '../'.repeat(30) + path.join(outsideDir, 'x').replace(/^[A-Za-z]:/, ''),
  outsideDir,
  'x/../../../outside',
  '..',
  '.',
  '%2e%2e%2foutside',
  'a\u0000/../../outside'
]

let server

test('setup', async (t) => {
  server = await listen(buildApp((app) => registerDataSaveRoutes(app, { dataRoot, fallbackDir })))
  t.end()
})

test('safeComponent reduces any input to one bounded, separator-free component', (t) => {
  t.equal(safeComponent('SYN001'), 'SYN001')
  t.equal(safeComponent(DATE), DATE, 'psychojs date format is preserved')
  t.equal(safeComponent('Pilot_R1-NEW'), 'Pilot_R1-NEW')
  t.equal(safeComponent('2026/11/17'), '2026_11_17', 'slash replaced as before')
  t.equal(safeComponent('.hidden'), 'hidden')
  t.equal(safeComponent(undefined), 'undefined', 'missing field keeps the legacy "undefined" name part')
  t.equal(safeComponent(''), 'undefined')
  t.equal(safeComponent(['a']), 'undefined')
  t.equal(safeComponent({ a: 1 }), 'undefined')
  t.equal(safeComponent(3), '3')
  t.equal(safeComponent('Z'.repeat(500)).length, COMPONENT_MAX)

  const nasty = [...TRAVERSALS, '../../../etc/passwd', '..', '...', '....//', '/', '\\', 'C:\\Windows',
    '<script>x</script>', 'a b', '\u2028', 'é/..', '.' + '/'.repeat(10)]
  for (const v of nasty) {
    const s = safeComponent(v)
    t.ok(/^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(s), `${JSON.stringify(v)} -> ${s} uses the allowlist, no leading dot`)
    t.notOk(s.includes('..'), `${JSON.stringify(v)} -> no ".."`)
    t.ok(s.length <= COMPONENT_MAX)
  }
  t.end()
})

test('study must be an existing directory directly under the data root', (t) => {
  t.equal(resolveStudyDir(dataRoot, 'STUDY_A'), studyDir)
  for (const bad of [...TRAVERSALS, 'STUDY_A/nested', 'STUDY_A\\nested', 'NO_SUCH_STUDY', studyDir,
    '', undefined, ['STUDY_A'], { s: 'STUDY_A' }, 'STUDY_A/', './STUDY_A', 'STUDY_A/..']) {
    t.equal(resolveStudyDir(dataRoot, bad), null, `study ${JSON.stringify(bad)} rejected`)
  }
  t.equal(resolveStudyDir(undefined, 'STUDY_A'), null, 'no DATA_PATH, no study directory')
  t.end()
})

test('/savecoop writes the expected file name in the study directory', async (t) => {
  clearResults()
  const r = await post(server, '/savecoop', { trials_data: TRIALS, expInfo: coopInfo(), save_token: token() })
  t.equal(r.status, 200)
  t.deepEqual(results(studyDir), [`undefined_SYN001_T1_Pilot_R1_NEW_${DATE}.csv`], 'same name the old handler produced')
  t.ok(fs.readFileSync(path.join(studyDir, results(studyDir)[0]), 'utf8').includes('SYNTH_RIGHT'))
  t.deepEqual(results(fallbackDir), [])
  t.end()
})

test('/savecoop: path traversal in any field never leaves the study or fallback directory', async (t) => {
  clearResults()
  // Existing files an attacker would target (names follow the *_<date>.csv pattern)
  fs.writeFileSync(path.join(outsideDir, `undefined_SYN001_T1_R1_${DATE}.csv`), 'original\n')
  fs.writeFileSync(path.join(dataRoot, `undefined_SYN001_T1_R1_${DATE}.csv`), 'original\n')
  const tmpTarget = unique('pwned')
  const before = snapshot()

  const fields = ['study', 'task', 'participant', 'session', 'run_id', 'date']
  for (const field of fields) {
    for (const value of [...TRAVERSALS, `../../outside/${tmpTarget}`, `/tmp/${tmpTarget}`]) {
      const r = await post(server, '/savecoop', {
        trials_data: [{ trial: 1, response: 'ATTACK' }],
        expInfo: coopInfo({ run_id: 'R1', [field]: value }),
        save_token: token()
      })
      t.equal(r.status, 200, `${field}=${JSON.stringify(value)} handled`)
    }
  }
  // study pointing at a nested directory or a missing one goes to the fallback
  for (const study of ['STUDY_A/nested', 'NO_SUCH_STUDY']) {
    await post(server, '/savecoop', { trials_data: TRIALS, expInfo: coopInfo({ study }), save_token: token() })
  }

  const after = snapshot()
  for (const f of Object.keys(before)) t.equal(after[f], before[f], `existing ${path.relative(scratch, f)} untouched`)
  const newFiles = created(before)
  t.ok(newFiles.length > 0, 'requests were saved somewhere')
  for (const f of newFiles) {
    t.ok(path.dirname(f) === studyDir || path.dirname(f) === fallbackDir, `${path.relative(scratch, f)} is inside STUDY_A/ or free/`)
  }
  t.deepEqual(results(nestedDir), [], 'nothing written to a nested directory')
  t.deepEqual(fs.readdirSync(outsideDir), [`undefined_SYN001_T1_R1_${DATE}.csv`], 'outside/ unchanged')
  t.notOk(fs.existsSync(path.join(os.tmpdir(), tmpTarget)), 'nothing created in the system temp directory')
  t.end()
})

test('/savecoop: identical expInfo twice never replaces the first file', async (t) => {
  clearResults()
  const first = await post(server, '/savecoop', { trials_data: [{ trial: 1, response: 'FIRST' }], expInfo: coopInfo() })
  t.equal(first.status, 200)
  const firstName = `undefined_SYN001_T1_Pilot_R1_NEW_${DATE}.csv`
  t.deepEqual(results(studyDir), [firstName])
  const original = fs.readFileSync(path.join(studyDir, firstName), 'utf8')

  // No token, another token, and a token-less JSON fd-style value: none may replace it
  await post(server, '/savecoop', { trials_data: [{ trial: 1, response: 'SECOND' }], expInfo: coopInfo() })
  await post(server, '/savecoop', { trials_data: [{ trial: 1, response: 'THIRD' }], expInfo: coopInfo(), save_token: token() })
  await post(server, '/savecoop', { trials_data: [{ trial: 1, response: 'FOURTH' }], expInfo: coopInfo(), save_token: ['x'.repeat(32)] })

  t.equal(fs.readFileSync(path.join(studyDir, firstName), 'utf8'), original, 'first file intact')
  const files = results(studyDir)
  t.equal(files.length, 4, 'each later request got its own file')
  const contents = files.map((f) => fs.readFileSync(path.join(studyDir, f), 'utf8'))
  for (const word of ['FIRST', 'SECOND', 'THIRD', 'FOURTH']) {
    t.equal(contents.filter((c) => c.includes(word)).length, 1, `${word} saved exactly once`)
  }
  for (const f of files.filter((f) => f !== firstName)) {
    t.ok(/^undefined_SYN001_T1_Pilot_R1_NEW_2026-11-17_14h05\.33\.123_[0-9a-f]{8}\.csv$/.test(f), `${f} has a server suffix`)
  }
  t.end()
})

test('/savecoop: a file that already exists is never replaced, even with a fresh token', async (t) => {
  clearResults()
  const name = `undefined_SYN001_T1_Pilot_R1_NEW_${DATE}.csv`
  fs.writeFileSync(path.join(studyDir, name), 'earlier run\n')
  await post(server, '/savecoop', { trials_data: TRIALS, expInfo: coopInfo(), save_token: token() })
  t.equal(fs.readFileSync(path.join(studyDir, name), 'utf8'), 'earlier run\n')
  t.equal(results(studyDir).length, 2)
  t.end()
})

test('/savecoop: one run (same token) keeps updating its own single file', async (t) => {
  clearResults()
  const runToken = token()
  const rows = []
  for (let i = 1; i <= 5; i++) {
    rows.push({ trial: i, response: `SYNTH_${i}` })
    const r = await post(server, '/savecoop', { trials_data: rows, expInfo: coopInfo(), save_token: runToken })
    t.equal(r.status, 200)
  }
  t.deepEqual(results(studyDir), [`undefined_SYN001_T1_Pilot_R1_NEW_${DATE}.csv`], 'progressive saves use one file')
  const content = fs.readFileSync(path.join(studyDir, results(studyDir)[0]), 'utf8')
  t.ok(content.includes('SYNTH_1') && content.includes('SYNTH_5'), 'file holds the latest cumulative data')

  // An attacker who copies the expInfo but not the token cannot replace it
  await post(server, '/savecoop', { trials_data: [{ trial: 1, response: 'ATTACK' }], expInfo: coopInfo(), save_token: token() })
  t.equal(fs.readFileSync(path.join(studyDir, `undefined_SYN001_T1_Pilot_R1_NEW_${DATE}.csv`), 'utf8'), content)

  // Concurrent saves from one run still end up in one file
  clearResults()
  const concurrentToken = token()
  await Promise.all([1, 2, 3, 4, 5].map((i) => post(server, '/savecoop', {
    trials_data: rows.slice(0, i),
    expInfo: coopInfo({ session: 'T2' }),
    save_token: concurrentToken
  })))
  t.deepEqual(results(studyDir), [`undefined_SYN001_T2_Pilot_R1_NEW_${DATE}.csv`], 'concurrent saves use one file')
  t.end()
})

test('/save: same confinement; legacy overwrite only inside the study directory', async (t) => {
  clearResults()
  const info = { task: 'synthetic_task', participant: 'SYN002', session: 'T1', date: '2026_11_17_14_05', study: 'STUDY_A' }
  let r = await post(server, '/save', { trials_data: TRIALS, expInfo: info })
  t.equal(r.status, 200)
  t.deepEqual(results(studyDir), ['synthetic_task_SYN002_T1_2026_11_17_14_05.csv'], 'same name the old handler produced')

  fs.writeFileSync(path.join(outsideDir, 'victim_SYN002_T1_x.csv'), 'original\n')
  const before = snapshot()
  for (const field of ['study', 'task', 'participant', 'session', 'date']) {
    for (const value of TRAVERSALS) {
      r = await post(server, '/save', { trials_data: TRIALS, expInfo: { ...info, [field]: value } })
      t.equal(r.status, 200, `${field}=${JSON.stringify(value)} handled`)
    }
  }
  const after = snapshot()
  for (const f of Object.keys(before).filter((f) => !f.startsWith(studyDir + path.sep))) {
    t.equal(after[f], before[f], `${path.relative(scratch, f)} untouched`)
  }
  for (const f of created(before)) {
    t.ok(path.dirname(f) === studyDir || path.dirname(f) === fallbackDir, `${path.relative(scratch, f)} is inside STUDY_A/ or free/`)
  }
  t.end()
})

test('/saveAudio: confined and never overwrites', async (t) => {
  clearResults()
  const audio = 'data:audio/wav;base64,' + Buffer.from('RIFF-synthetic-audio').toString('base64')
  const info = { task: 'synthetic_task', participant: 'SYN003', block: '1', session: 'T1', date: '2026_11_17', study: 'STUDY_A' }
  let r = await post(server, '/saveAudio', { base64data: audio, expInfo: info })
  t.equal(r.status, 200)
  const name = 'synthetic_task_SYN003_B1_T1_2026_11_17.wav'
  t.deepEqual(results(studyDir), [name])
  t.equal(fs.readFileSync(path.join(studyDir, name), 'utf8'), 'RIFF-synthetic-audio')

  r = await post(server, '/saveAudio', { base64data: 'data:audio/wav;base64,' + Buffer.from('OTHER').toString('base64'), expInfo: info })
  t.equal(fs.readFileSync(path.join(studyDir, name), 'utf8'), 'RIFF-synthetic-audio', 'first file intact')
  t.equal(results(studyDir).length, 2)

  const before = snapshot()
  for (const field of ['study', 'task', 'participant', 'block', 'session', 'date']) {
    for (const value of TRAVERSALS) {
      await post(server, '/saveAudio', { base64data: audio, expInfo: { ...info, [field]: value } })
    }
  }
  const after = snapshot()
  for (const f of Object.keys(before)) t.equal(after[f], before[f], `${path.relative(scratch, f)} untouched`)
  for (const f of created(before)) {
    t.ok(path.dirname(f) === studyDir || path.dirname(f) === fallbackDir, `${path.relative(scratch, f)} is inside STUDY_A/ or free/`)
  }
  t.end()
})

test('malformed bodies are rejected and nothing is written', async (t) => {
  clearResults()
  const before = snapshot()
  for (const route of ['/save', '/savecoop']) {
    t.equal((await post(server, route, {})).status, 400)
    t.equal((await post(server, route, { trials_data: TRIALS })).status, 400)
    t.equal((await post(server, route, { trials_data: TRIALS, expInfo: ['x'] })).status, 400)
    t.equal((await post(server, route, { trials_data: TRIALS, expInfo: 'x' })).status, 400)
    t.equal((await post(server, route, { trials_data: 'x', expInfo: coopInfo() })).status, 400)
  }
  t.equal((await post(server, '/saveAudio', { expInfo: coopInfo() })).status, 400)
  t.equal((await post(server, '/saveAudio', { base64data: ['x'], expInfo: coopInfo() })).status, 400)
  t.deepEqual(snapshot(), before)
  t.end()
})

test('no usable directory: request fails, nothing is written elsewhere', async (t) => {
  const s = await listen(buildApp((app) => registerDataSaveRoutes(app, {
    dataRoot: path.join(scratch, 'missing-root'),
    fallbackDir: path.join(scratch, 'missing-free')
  })))
  const before = snapshot()
  const r = await post(s, '/savecoop', { trials_data: TRIALS, expInfo: coopInfo(), save_token: token() })
  s.close()
  t.equal(r.status, 500)
  t.deepEqual(snapshot(), before)
  t.end()
})

test('stimtoolapi.js wires /savecoop to the safe handler', async (t) => {
  // Uses DATA_PATH from the environment, as in production. Only a valid study is used here,
  // so the fallback (data/free under the working directory) is never touched.
  clearResults()
  const saved = { DATA_PATH: process.env.DATA_PATH, KEYS_PATH: process.env.KEYS_PATH }
  process.env.DATA_PATH = dataRoot
  process.env.KEYS_PATH = path.join(scratch, 'no-keys.json')
  const s = await listen(buildApp((app) => require('../stimtoolapi.js')(app)))
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }

  // With the old handler this wrote scratch/outside/w_SYN001_... (DATA_PATH/STUDY_A/../../outside/w)
  const victim = path.join(outsideDir, 'w_SYN001_T1_R1_x.csv')
  fs.writeFileSync(victim, 'original\n')
  const before = snapshot()
  for (const [task, token1] of [['../../outside/w', token()], ['../../outside/w', token()]]) {
    await post(s, '/savecoop', { trials_data: TRIALS, expInfo: coopInfo({ task, run_id: 'R1', date: 'x' }), save_token: token1 })
  }
  await sleep(300) // the old handler answered before writing
  s.close()

  t.equal(fs.readFileSync(victim, 'utf8'), 'original\n', 'existing file outside the data root untouched')
  t.deepEqual(fs.readdirSync(outsideDir).sort(), [`undefined_SYN001_T1_R1_${DATE}.csv`, 'victim_SYN002_T1_x.csv', 'w_SYN001_T1_R1_x.csv'].sort(),
    'no new file in outside/')
  const newFiles = created(before)
  t.equal(newFiles.length, 2, 'both requests saved, neither replaced the other')
  for (const f of newFiles) t.equal(path.dirname(f), studyDir)
  t.end()
})

test('teardown', (t) => {
  server.close()
  fs.rmSync(scratch, { recursive: true, force: true })
  t.end()
})
