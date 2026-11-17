// Regression tests for GET /link, POST /adduser and POST /mturklink (CWE-829 / CWE-22).
//
// /link used to require() './public/study/' + study + '_' + session + '.json' with values from
// the dashboard table, which /adduser and /mturklink filled from unauthenticated requests.
// require() resolves '..' lexically and retries with .js appended, so a planted
// '<name>.json.js' ran inside the server, and a planted JSON file chose the redirect target.
//
// Runs the real routes from stimtoolapi.js on a local, throwaway Express app with an in-memory
// stand-in for the dashboard table. No database is contacted. All data is synthetic; every file
// the test plants is removed in teardown.
//
//   npm test

const test = require('tape')
const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')
const crypto = require('crypto')

const APP_ROOT = path.resolve(__dirname, '..')
const STUDY_DIR = path.join(APP_ROOT, 'public', 'study')
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'studylink-test-'))

// tape loads every test file in one process: keep any settings an earlier file made
process.env.HIT_LOG_DIR = process.env.HIT_LOG_DIR || path.join(scratch, 'hit_codes')
process.env.DATA_PATH = process.env.DATA_PATH || path.join(scratch, 'data')
process.env.KEYS_PATH = process.env.KEYS_PATH || path.join(scratch, 'no-keys.json')
process.env.LOG_LEVEL = 'silent'

const express = require('express')
const bodyParser = require('body-parser')
const expressSanitizer = require('express-sanitizer')
const models = require('../models')
const { isValidName, studyFilePath, isLocalPath } = require('../studyfiles')

// ---- in-memory dashboard table ------------------------------------------------------------
const rows = []
const createCalls = []
const matches = (row, where) => Object.keys(where).every((k) => row[k] === where[k])
models.dashboard = {
  findOne: async ({ where }) => rows.find((r) => matches(r, where)) || null,
  create: async (values) => {
    createCalls.push(values)
    const row = { ...values }
    rows.push(row)
    return row
  }
}
// A row as an attacker could have stored it before the fix (or as a legacy row may look)
function plantRow (study, session) {
  const link = crypto.randomUUID()
  rows.push({ subject: 'SYNTH_ATTACKER', study, session, link })
  return link
}

// ---- helpers ------------------------------------------------------------------------------
const hex = () => crypto.randomBytes(6).toString('hex')
const flagName = () => `__STUDYLINK_TEST_EXECUTED_${hex()}`
const planted = [] // files created by this test, removed in teardown

function plant (file, content) {
  fs.writeFileSync(file, content)
  planted.push(file)
}

// What the old handler passed to require(), resolved the way require() does (relative to stimtoolapi.js)
const legacyPath = (study, session) =>
  path.resolve(APP_ROOT, './public/study/' + study + '_' + session + '.json')

function listen (app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function request (server, method, route, body, asJson) {
  const payload = body === undefined ? '' : asJson ? JSON.stringify(body) : new URLSearchParams(body).toString()
  const { port } = server.address()
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: route,
      method,
      headers: {
        'Content-Type': asJson ? 'application/json' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let text = ''
      res.on('data', (c) => { text += c })
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, text }))
    })
    req.on('error', reject)
    req.end(payload)
  })
}
const getLink = (server, id, index) =>
  request(server, 'GET', '/link?id=' + encodeURIComponent(id) + (index === undefined ? '' : '&index=' + encodeURIComponent(index)))
const post = (server, route, body, asJson) => request(server, 'POST', route, body, asJson)

async function waitFor (cond, ms = 2000) {
  const end = Date.now() + ms
  while (!cond() && Date.now() < end) await new Promise((resolve) => setTimeout(resolve, 10))
  return cond()
}

// ---- synthetic study definition -----------------------------------------------------------
const SYNTH_STUDY = `SYNTHTEST_${hex()}`
const SYNTH_SESSION = 'T1'
const SYNTH_ORDER = [
  '/?index=0&task=synthetic_task', // 0: valid
  '/completed?synthetic=1', // 1: valid
  '//evil.example/x?', // 2: protocol-relative
  'https://evil.example/x?', // 3: absolute URL
  '/\\evil.example/x?', // 4: backslash, browsers read as '//'
  '/\t/evil.example/x?', // 5: tab is stripped by browsers, giving '//'
  42 // 6: not a string
]

let server

test('setup', async (t) => {
  fs.mkdirSync(process.env.HIT_LOG_DIR, { recursive: true })
  plant(path.join(STUDY_DIR, `${SYNTH_STUDY}_${SYNTH_SESSION}.json`), JSON.stringify({ order: SYNTH_ORDER }))

  const app = express()
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(expressSanitizer())
  require('../stimtoolapi.js')(app)
  server = await listen(app)
  t.end()
})

// ---- /link --------------------------------------------------------------------------------

test('/link redirects to the study order entry for a valid row', async (t) => {
  const link = plantRow(SYNTH_STUDY, SYNTH_SESSION)
  let r = await getLink(server, link)
  t.equal(r.status, 302)
  t.equal(r.location, `/?index=0&task=synthetic_task&id=${link}`)
  r = await getLink(server, link, '1')
  t.equal(r.location, `/completed?synthetic=1&id=${link}`)
  t.end()
})

// study '../../x' + '_' + session '/../<name>' gives 'public/study/../../x_/../<name>.json':
// the leading '/' in session closes the 'x_' segment so the following '..' is a real dot
// segment, and the path resolves to <app root>/<name>.json.
const ESCAPE_STUDY = '../../x'
const escapeSession = (name) => '/../' + name

test('/link never executes a planted .json.js outside public/study (traversal row)', async (t) => {
  const flag = flagName()
  const name = `pwned-${hex()}`
  const study = ESCAPE_STUDY
  const session = escapeSession(name)
  const target = legacyPath(study, session)
  t.equal(target, path.join(APP_ROOT, name + '.json'), 'legacy path escapes public/study to the app root')
  // require(target) finds no .json file and falls back to target + '.js'
  plant(target + '.js', `global[${JSON.stringify(flag)}] = true\nmodule.exports = { order: ['https://evil.example/pwned?'] }\n`)

  const r = await getLink(server, plantRow(study, session))
  t.equal(r.status, 302)
  t.equal(r.location, '/', 'redirected home')
  t.notOk(global[flag], 'planted code did not run')
  t.notOk(require.cache[target + '.js'], 'planted file was not loaded as a module')
  t.end()
})

test('/link never reads a planted JSON file outside public/study', async (t) => {
  const name = `pwned-${hex()}`
  const study = ESCAPE_STUDY
  const session = escapeSession(name)
  const target = legacyPath(study, session)
  t.equal(target, path.join(APP_ROOT, name + '.json'), 'legacy path escapes public/study to the app root')
  plant(target, JSON.stringify({ order: ['https://evil.example/json?'] }))

  const r = await getLink(server, plantRow(study, session))
  t.equal(r.location, '/', 'planted order[] not used as redirect target')
  t.notOk(require.cache[target])
  t.end()
})

test('/link never executes <study>_<session>.json.js inside public/study', async (t) => {
  // Name passes the allowlist, but the exact .json file does not exist; require() would
  // have fallen back to the .js sibling.
  const flag = flagName()
  const study = `SYNTHMISSING_${hex()}`
  const js = path.join(STUDY_DIR, `${study}_T1.json.js`)
  plant(js, `global[${JSON.stringify(flag)}] = true\nmodule.exports = { order: ['https://evil.example/js?'] }\n`)

  const r = await getLink(server, plantRow(study, 'T1'))
  t.equal(r.location, '/')
  t.notOk(global[flag], 'planted code did not run')
  t.notOk(require.cache[js])
  t.end()
})

test('/link redirects home for rows with separators, dot segments or extensions', async (t) => {
  const bad = [
    [ESCAPE_STUDY, escapeSession('package')], // resolves to <app root>/package.json, which exists
    ['..', '..'],
    ['../study', SYNTH_SESSION],
    [SYNTH_STUDY, '../' + SYNTH_STUDY + '_' + SYNTH_SESSION],
    ['..\\..\\x', '..\\evil'],
    ['/etc/passwd', 'x'],
    [SYNTH_STUDY + '_' + SYNTH_SESSION + '.json', 'x'],
    [SYNTH_STUDY, SYNTH_SESSION + '.json'],
    [SYNTH_STUDY + '/.', SYNTH_SESSION],
    ['.', SYNTH_SESSION],
    ['', ''],
    [null, null],
    [SYNTH_STUDY, SYNTH_SESSION + '\u0000']
  ]
  for (const [study, session] of bad) {
    const r = await getLink(server, plantRow(study, session))
    t.equal(r.location, '/', `row ${JSON.stringify([study, session])} -> home`)
  }
  t.end()
})

test('/link only redirects to local paths from the study file', async (t) => {
  const link = plantRow(SYNTH_STUDY, SYNTH_SESSION)
  for (const index of ['2', '3', '4', '5', '6']) {
    const r = await getLink(server, link, index)
    t.equal(r.location, '/', `order[${index}] ${JSON.stringify(SYNTH_ORDER[index])} rejected`)
  }
  for (const index of ['7', '9999', '-1', '1abc', '0x1', '1e1']) {
    const r = await getLink(server, link, index)
    t.equal(r.location, '/', `index ${index} rejected`)
  }
  t.end()
})

test('/link with an unknown id redirects home', async (t) => {
  const r = await getLink(server, crypto.randomUUID())
  t.equal(r.location, '/')
  t.end()
})

// ---- /adduser and /mturklink --------------------------------------------------------------

const BAD_PAIRS = [
  ['../../x', '/../pwned'], // the working escape from the finding
  ['../../x', '../pwned'],
  ['..', '..'],
  ['a/b', SYNTH_SESSION],
  ['a\\b', SYNTH_SESSION],
  [SYNTH_STUDY, '../' + SYNTH_SESSION],
  [SYNTH_STUDY, SYNTH_SESSION + '/..'],
  [SYNTH_STUDY, SYNTH_SESSION + '.json'],
  [SYNTH_STUDY + '.json', SYNTH_SESSION],
  ['.', SYNTH_SESSION],
  ['%2e%2e', SYNTH_SESSION],
  ['', SYNTH_SESSION],
  [SYNTH_STUDY, ''],
  ['NoSuchStudy' + hex(), SYNTH_SESSION] // allowed format, but no study definition
]

test('/adduser rejects study/session values that are not an existing study', async (t) => {
  const before = createCalls.length
  for (const [study, session] of BAD_PAIRS) {
    const r = await post(server, '/adduser', { subject: 'SYNTH01', study, session })
    t.equal(r.status, 400, `/adduser ${JSON.stringify([study, session])} rejected`)
  }
  for (const study of [[SYNTH_STUDY], { a: SYNTH_STUDY }, 1, true, null]) {
    const r = await post(server, '/adduser', { subject: 'SYNTH01', study, session: SYNTH_SESSION }, true)
    t.equal(r.status, 400, `/adduser non-string study ${JSON.stringify(study)} rejected`)
  }
  const r = await post(server, '/adduser', { study: SYNTH_STUDY, session: SYNTH_SESSION })
  t.equal(r.status, 400, 'missing subject rejected')
  t.equal(createCalls.length, before, 'no rows created')
  t.end()
})

test('/adduser creates a row for a real study and returns its link', async (t) => {
  const before = createCalls.length
  const subject = 'SYNTH' + hex()
  let r = await post(server, '/adduser', { subject, study: SYNTH_STUDY, session: SYNTH_SESSION })
  t.equal(r.status, 200)
  const body = JSON.parse(r.text)
  t.equal(body.message, 'ok')
  t.equal(body.info.study, SYNTH_STUDY)
  t.equal(body.info.session, SYNTH_SESSION)
  t.match(body.info.link, /^[0-9a-f-]{36}$/)
  t.equal(createCalls.length, before + 1)

  // The link it returned works end to end
  const link = await getLink(server, body.info.link)
  t.equal(link.location, `/?index=0&task=synthetic_task&id=${body.info.link}`)

  // Same subject/study/session again: existing row, nothing new
  r = await post(server, '/adduser', { subject, study: SYNTH_STUDY, session: SYNTH_SESSION })
  t.equal(JSON.parse(r.text).message, 'subject/study/session already exists in database')
  t.equal(createCalls.length, before + 1)
  t.end()
})

test('/mturklink rejects study/session values that are not an existing study', async (t) => {
  const before = createCalls.length
  for (const [study, session] of BAD_PAIRS) {
    const r = await post(server, '/mturklink', { subject: 'SYNTH01', study, session })
    t.equal(r.status, 400, `/mturklink ${JSON.stringify([study, session])} rejected`)
  }
  await new Promise((resolve) => setTimeout(resolve, 50)) // the old handler created rows after responding
  t.equal(createCalls.length, before, 'no rows created')
  t.end()
})

test('/mturklink still creates a row for a real study', async (t) => {
  const before = createCalls.length
  const r = await post(server, '/mturklink', { subject: 'SYNTH' + hex(), study: SYNTH_STUDY, session: SYNTH_SESSION })
  t.equal(r.status, 301)
  t.ok(await waitFor(() => createCalls.length === before + 1), 'row created')
  t.equal(createCalls[createCalls.length - 1].study, SYNTH_STUDY)
  t.end()
})

// ---- helpers in studyfiles.js -------------------------------------------------------------

test('studyFilePath only returns direct children of public/study named <study>_<session>.json', (t) => {
  t.equal(studyFilePath('AAC-BET', 'T2'), path.join(STUDY_DIR, 'AAC-BET_T2.json'))
  for (const [study, session] of BAD_PAIRS.slice(0, -1)) {
    t.equal(studyFilePath(study, session), null, `${JSON.stringify([study, session])} refused`)
  }
  t.notOk(isValidName('a'.repeat(101)))
  t.ok(isValidName('AMPA_TLFB'))
  t.ok(isValidName('Week-10'))
  t.end()
})

test('every shipped study file name and order entry passes the new checks', (t) => {
  // Guards against the allowlist breaking an existing study
  for (const file of fs.readdirSync(STUDY_DIR)) {
    if (file.startsWith('SYNTH') || !file.endsWith('.json')) continue
    const base = file.slice(0, -'.json'.length)
    const cut = base.lastIndexOf('_')
    t.ok(cut > 0 && studyFilePath(base.slice(0, cut), base.slice(cut + 1)) !== null, `${file} name accepted`)
    const { order } = JSON.parse(fs.readFileSync(path.join(STUDY_DIR, file), 'utf8'))
    t.ok(Array.isArray(order) && order.every((u) => isLocalPath(u + '&id=00000000-0000-0000-0000-000000000000')),
      `${file} order entries are local paths`)
  }
  t.end()
})

test('isLocalPath', (t) => {
  for (const ok of ['/', '/?index=0&task=x', '/completed?a=1&id=x', '/js/tasks/driving/completed.html']) {
    t.ok(isLocalPath(ok), ok)
  }
  for (const bad of ['', 'evil.example', '//evil.example', '///evil.example', '/\\evil.example', '\\\\evil.example',
    'https://evil.example', 'javascript:alert(1)', '/\t/evil.example', '/\n/evil.example', ' /x', '/x y',
    '/' + 'a'.repeat(3000), undefined, null, 42, ['/x']]) {
    t.notOk(isLocalPath(bad), JSON.stringify(bad))
  }
  t.end()
})

test('teardown', (t) => {
  server.close()
  for (const p of planted) if (fs.existsSync(p)) fs.unlinkSync(p)
  fs.rmSync(scratch, { recursive: true, force: true })
  t.end()
})
