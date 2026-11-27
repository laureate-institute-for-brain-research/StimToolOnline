// Regression tests for the legacy result routes in api.js (CWE-770): the score helpers used to
// read a whole result file synchronously and split every line and cell, and POST /saveChickenTask/
// (and the other legacy save routes) let anyone write a file of up to 100 MB for them to parse.
//
// Every file here is synthetic and lives in a fresh temp directory.
//
//   npm test

const test = require('tape')
const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')

const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'legacyresults-test-')))
process.env.LOG_LEVEL = 'silent'
process.env.KEYS_PATH = path.join(scratch, 'no-keys.json')

const express = require('express')
const bodyParser = require('body-parser')
const { handleRouteError } = require('../pages')
const legacy = require('../legacyresults')
const { MAX_CONTENT_BYTES, MAX_FILE_BYTES, MAX_ROWS, MAX_CELLS } = legacy

const API = path.join(__dirname, '..', 'api.js')

// scratch/work/ is the working directory while these tests run (api.js uses relative paths)
//   data/wave3/tasks, data/wave3/surveys   a known study
//   surveys/data                            the fixed /getASI directory
const workDir = path.join(scratch, 'work')
const tasksDir = path.join(workDir, 'data', 'wave3', 'tasks')
const surveysDir = path.join(workDir, 'data', 'wave3', 'surveys')
const asiDir = path.join(workDir, 'surveys', 'data')
for (const d of [tasksDir, surveysDir, asiDir]) fs.mkdirSync(d, { recursive: true })

const ctFile = (id, s) => path.join(tasksDir, `wave3-CT-${id}-T${s}.csv`)
const surveyFile = (name, id, s) => path.join(surveysDir, `wave3-SURVEY-${name}-${id}-T${s}.csv`)

// A real-sized chicken task export: 2 header rows, 400 main trials (rt 0.5 s), 321 points at trial 400
function chickenExport () {
  const rows = ['Version,1,Pattern,1,Type,predict_2,Orginal_File_Name,CT-SYN001-T1.csv', 'trial_type,trial_number,block_num,egg_x_position,egg_y_position,absolute_time_sec,response_time_sec,response,current_chicken,next_chicken,correct,points']
  for (let i = 1; i <= 20; i++) rows.push(`practice1,${i},0,10,20,1.0,0.7,1,1,1,1,${i}`)
  for (let i = 1; i <= 400; i++) rows.push(`main,${i},1,10,20,${i}.0,0.5,1,1,2,1,${i === 400 ? 321 : i % 300}`)
  return rows.join('\n') + '\n'
}

function surveyExport (answers) {
  return 'synthetic-survey,"User Agent: synthetic",IP: 0.0.0.0\nQUESTION,RESULT,RT(ms)\n' +
    answers.map(([q, a]) => `${q},"${a}",100`).join('\n') + '\n'
}

// A file of `bytes` bytes without writing them (sparse where the file system supports it)
function bigFile (file, bytes) {
  fs.writeFileSync(file, '')
  fs.truncateSync(file, bytes)
}

// Anything thrown outside Express lands here instead of killing the test run
const escaped = []
const onUncaught = (err) => escaped.push(err)
process.on('uncaughtException', onUncaught)

// withLegacyParsers: the stimtool.js setup (small parsers on the legacy save routes first).
// Without it, only the global 100 MB parsers run, so the route handlers' own checks are tested.
function buildApp ({ withLegacyParsers }) {
  const app = express()
  if (withLegacyParsers) app.use(legacy.SAVE_PATHS, legacy.saveBodyParsers())
  app.use(bodyParser.urlencoded({ extended: true, parameterLimit: 1000000, limit: '100mb' }))
  app.use(bodyParser.json({ limit: '100mb' }))
  require(API)(app, { pagesRoot: path.join(scratch, 'no-pages') })
  app.use(handleRouteError)
  return app
}

function listen (app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server))
  })
}

// Never rejects: a request the server never answers resolves as 'timeout'
function request (server, method, route, body) {
  const { port } = server.address()
  const payload = body === undefined ? undefined : JSON.stringify(body)
  const headers = { 'User-Agent': 'synthetic-agent' }
  if (payload !== undefined) {
    headers['Content-Type'] = 'application/json'
    headers['Content-Length'] = Buffer.byteLength(payload)
  }
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, path: route, method, headers }, (res) => {
      let text = ''
      res.setEncoding('utf8')
      res.on('data', (c) => { text += c })
      res.on('end', () => resolve({ status: res.statusCode, text }))
      res.on('error', () => resolve({ status: 'aborted', text }))
    })
    req.setTimeout(10000, () => { req.destroy(); resolve({ status: 'timeout', text: '' }) })
    req.on('error', (err) => resolve({ status: 'error:' + err.code, text: '' }))
    req.end(payload)
  })
}
const get = (server, route) => request(server, 'GET', route)
const post = (server, route, body) => request(server, 'POST', route, body)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Counts the bytes read from disk through fs.readFileSync / fs.readSync while active
function spyReads () {
  const counter = { bytes: 0 }
  const origFile = fs.readFileSync
  const origSync = fs.readSync
  fs.readFileSync = function (...args) {
    const out = origFile.apply(this, args)
    counter.bytes += out.length
    return out
  }
  fs.readSync = function (...args) {
    const n = origSync.apply(this, args)
    counter.bytes += n
    return n
  }
  counter.restore = () => { fs.readFileSync = origFile; fs.readSync = origSync }
  return counter
}

let plain, wired, cwd

test('setup', async (t) => {
  cwd = process.cwd()
  process.chdir(workDir)
  fs.writeFileSync(ctFile('SYN001', 1), chickenExport())
  fs.writeFileSync(surveyFile('panasx', 'SYN001', 1), surveyExport([['panasx_afraid', 3], ['panasx_happy', 2], ['panasx_calm', 4]]))
  fs.writeFileSync(surveyFile('phq', 'SYN001', 1), surveyExport([['phq_1', 1], ['phq_2', 2], ['phq_3', 3]]))
  plain = await listen(buildApp({ withLegacyParsers: false }))
  wired = await listen(buildApp({ withLegacyParsers: true }))
  t.end()
})

async function assertScoresStillServed (t, label) {
  const r = await get(plain, '/getScores?study=wave3&mkturk_id=SYN001')
  t.equal(r.status, 200, `${label}: legitimate /getScores still answered`)
  let body = {}
  try { body = JSON.parse(r.text) } catch (e) {}
  t.deepEqual(body.ChickenTask && body.ChickenTask.T1, { points: '321', avg_rt: 0.5 }, `${label}: chicken score`)
}

test('scores for real-sized exports are unchanged', async (t) => {
  const r = await get(plain, '/getScores?study=wave3&mkturk_id=SYN001')
  t.equal(r.status, 200)
  const body = JSON.parse(r.text)
  t.deepEqual(body.ChickenTask.T1, { points: '321', avg_rt: 0.5 }, 'chicken task T1 score')
  t.deepEqual(body.ChickenTask.T2, {}, 'missing T2 file -> {} as before')
  t.equal(body.PANASX.T1.panasx_negaffect_score, 3, 'PANAS-X negative affect')
  t.equal(body.PANASX.T1.panasx_joviality_score, 2, 'PANAS-X joviality')
  t.equal(body.PANASX.T1.panasx_serenity_score, 4, 'PANAS-X serenity')
  t.deepEqual(body.PANASX.T2, {}, 'missing PANAS-X T2 -> {}')

  const phq = await get(plain, '/getPHQ?study=wave3&mkturk_id=SYN001&session=1')
  t.equal(phq.status, 200)
  t.equal(phq.text, '6', 'PHQ total')
  t.end()
})

test('readCsvRows gives the same rows as the old parser for a normal file', (t) => {
  const file = ctFile('SYN001', 1)
  const text = fs.readFileSync(file, 'utf8')
  t.deepEqual(legacy.readCsvRows(file), text.split('\n').map((l) => l.split(',')))
  t.end()
})

test('readCsvRows keeps at most MAX_CELLS cells per row', (t) => {
  const file = path.join(scratch, 'wide.csv')
  fs.writeFileSync(file, 'a,b\n' + ','.repeat(100000) + '\n')
  const rows = legacy.readCsvRows(file)
  t.equal(rows.length, 3)
  t.deepEqual(rows[0], ['a', 'b'])
  t.equal(rows[1].length, MAX_CELLS, 'wide row capped')
  t.end()
})

test('an oversized planted result file is refused without being read', async (t) => {
  // 64 MB, and a newline-dense file just over the limit: the shapes from the finding
  bigFile(ctFile('SYN_BIG', 1), 64 * 1024 * 1024)
  fs.writeFileSync(ctFile('SYN_NL', 1), '\n'.repeat(MAX_FILE_BYTES + 1))
  bigFile(surveyFile('panasx', 'SYN_BIG', 2), 64 * 1024 * 1024)
  for (const name of ['phq', 'oasis', 'panas']) bigFile(surveyFile(name, 'SYN_BIG', 1), 64 * 1024 * 1024)
  bigFile(path.join(asiDir, 'SURVEY-asi-SYN_BIG-T2.csv'), 64 * 1024 * 1024)

  const routes = [
    '/getScores?study=wave3&mkturk_id=SYN_BIG',
    '/getScores?study=wave3&mkturk_id=SYN_NL',
    '/getPHQ?study=wave3&mkturk_id=SYN_BIG&session=1',
    '/getOASIS?study=wave3&mkturk_id=SYN_BIG&session=1',
    '/getPANAS?type=positive&study=wave3&mkturk_id=SYN_BIG&session=1',
    '/getPANAS?type=negative&study=wave3&mkturk_id=SYN_BIG&session=1',
    ...['total', 'physical', 'cognitive', 'social'].map((type) => `/getASI?type=${type}&mkturk_id=SYN_BIG`)
  ]
  for (const route of routes) {
    const spy = spyReads()
    const r = await get(plain, route)
    spy.restore()
    t.equal(r.status, 413, `${route} -> 413`)
    t.ok(spy.bytes <= MAX_FILE_BYTES + 1, `${route}: read ${spy.bytes} bytes (limit ${MAX_FILE_BYTES})`)
  }

  // Repeating the request costs the same small amount every time
  const repeated = await Promise.all(Array.from({ length: 20 }, () => get(plain, '/getScores?study=wave3&mkturk_id=SYN_BIG')))
  t.ok(repeated.every((r) => r.status === 413), '20 concurrent repeats -> 413')
  t.deepEqual(escaped, [], 'nothing thrown outside Express')
  await assertScoresStillServed(t, 'after oversized files')
  t.end()
})

test('a small file with too many rows is refused', async (t) => {
  fs.writeFileSync(ctFile('SYN_ROWS', 1), 'a\n'.repeat(MAX_ROWS + 1))
  t.ok(fs.statSync(ctFile('SYN_ROWS', 1)).size < MAX_FILE_BYTES, 'file is under the byte limit')
  const r = await get(plain, '/getScores?study=wave3&mkturk_id=SYN_ROWS')
  t.equal(r.status, 413, 'too many rows -> 413')
  t.end()
})

test('score routes refuse identifiers that are not one plain path component', async (t) => {
  const routes = [
    '/getScores?study=..&mkturk_id=SYN001',
    '/getScores?study=wave3&mkturk_id=..%2F..%2Fx',
    '/getScores?study=wave3',
    '/getPHQ?study=wave3&mkturk_id=SYN001&session=1%2F..%2F..',
    '/getASI?type=total&mkturk_id=..%2Fx'
  ]
  for (const route of routes) {
    t.equal((await get(plain, route)).status, 400, `${route} -> 400`)
  }
  t.end()
})

test('/saveChickenTask/: oversized content is refused and nothing is written', async (t) => {
  const route = '/saveChickenTask/?study=wave3&session=2&mkturk_id=SYN_SAVE&task=ct&version=1'
  for (const content of ['x'.repeat(MAX_CONTENT_BYTES + 1), '\n'.repeat(MAX_CONTENT_BYTES + 1)]) {
    const r = await post(plain, route, { content })
    t.equal(r.status, 413, `content of ${content.length} bytes -> 413`)
  }
  const dp = await post(plain, '/saveDPTask/?study=wave3&session=2&mkturk_id=SYN_SAVE&task=dp', { content: 'x'.repeat(MAX_CONTENT_BYTES + 1) })
  t.equal(dp.status, 413, '/saveDPTask/ oversized content -> 413')
  await sleep(300) // a write, if one had been queued, would have landed by now
  t.notOk(fs.existsSync(ctFile('SYN_SAVE', 2)), 'no chicken task file written')
  t.notOk(fs.existsSync(path.join(tasksDir, 'wave3-DP-SYN_SAVE-T2.csv')), 'no DP file written')
  t.deepEqual(escaped, [], 'nothing thrown outside Express')
  t.end()
})

test('/saveChickenTask/: only a known study and plain identifiers are written', async (t) => {
  const before = fs.readdirSync(tasksDir).sort()
  const cases = [
    ['/saveChickenTask/?study=NO_SUCH_STUDY&session=2&mkturk_id=SYN002&task=ct', 404],
    ['/saveChickenTask/?study=..&session=2&mkturk_id=SYN002&task=ct', 400],
    ['/saveChickenTask/?session=2&mkturk_id=SYN002&task=ct', 400],
    ['/saveChickenTask/?study=wave3&session=2&mkturk_id=..%2F..%2F..%2Fescape&task=ct', 400],
    ['/saveChickenTask/?study=wave3&session=2%2F..%2F..&mkturk_id=SYN002&task=ct', 400],
    ['/saveChickenTask/?study=wave3&session=2&task=ct', 400],
    ['/saveDPTask/?study=wave3&session=2&mkturk_id=..%2Fescape&task=dp', 400]
  ]
  for (const [route, status] of cases) {
    t.equal((await post(plain, route, { content: 'main,1' })).status, status, `${route} -> ${status}`)
  }
  t.equal((await post(plain, '/saveChickenTask/?study=wave3&session=2&mkturk_id=SYN002&task=ct', {})).status, 400, 'missing content -> 400')
  await sleep(300)
  t.deepEqual(fs.readdirSync(tasksDir).sort(), before, 'nothing written to the study')
  t.notOk(fs.existsSync(path.join(scratch, 'escape-T2.csv')) || fs.existsSync(path.join(workDir, 'escape-T2.csv')), 'nothing written outside')
  t.end()
})

test('/saveChickenTask/: a normal-sized save is still written', async (t) => {
  const content = chickenExport().split('\n').slice(2).join('\n')
  // The route still ends in the disabled MySQL code (an error status), after the write is queued
  await post(plain, '/saveChickenTask/?study=wave3&session=2&mkturk_id=SYN003&task=ct&version=1', { content })
  await sleep(300)
  const file = ctFile('SYN003', 2)
  t.ok(fs.existsSync(file), 'file written')
  t.ok(fs.existsSync(file) && fs.readFileSync(file, 'utf8').endsWith(content), 'content saved')
  t.deepEqual(escaped, [], 'nothing thrown outside Express')
  t.end()
})

test('legacy save routes get the small body limit before the 100 MB parsers', async (t) => {
  const big = { content: 'x'.repeat(3 * 1024 * 1024) }
  for (const route of ['/saveChickenTask/?study=wave3&session=2&mkturk_id=SYN004&task=ct', '/SAVECHICKENTASK?study=wave3&session=2&mkturk_id=SYN004&task=ct',
    '/saveDPTask/?study=wave3&session=2&mkturk_id=SYN004&task=dp', '/saveSurvey/?study=wave3&session=2&mkturk_id=SYN004&survey=phq',
    '/saveGoNoGo?id=SYN004&session=1', '/saveSquareCircleRating?id=SYN004']) {
    t.equal((await post(wired, route, big)).status, 413, `${route.split('?')[0]}: 3 MB body -> 413`)
  }
  await sleep(300)
  t.notOk(fs.existsSync(ctFile('SYN004', 2)), 'nothing written')

  // A normal body still goes through the scoped parser
  const content = 'main,1,1,10,20,1.0,0.5,1,1,2,1,1\n'
  await post(wired, '/saveChickenTask/?study=wave3&session=2&mkturk_id=SYN005&task=ct', { content })
  await sleep(300)
  t.ok(fs.existsSync(ctFile('SYN005', 2)) && fs.readFileSync(ctFile('SYN005', 2), 'utf8').endsWith(content), 'normal save written')
  t.end()
})

test('append routes refuse unsafe identifiers and stop growing a full file', async (t) => {
  const row = [{ trial_index: 1, trial_type: 'synth', trial_number: 1, test_part: 'test', result: 'ok', time_elapsed: 10, rt: 5, key_press: 1, outcome: 'x', points: 0 }]
  const full = path.join(tasksDir, 'wave3-GT-SYN_FULL-T1.csv')
  bigFile(full, MAX_FILE_BYTES)
  t.equal((await post(plain, '/saveGoNoGo?id=SYN_FULL&session=1&version=1', row)).status, 413, 'full file -> 413')
  await sleep(200)
  t.equal(fs.statSync(full).size, MAX_FILE_BYTES, 'full file not appended to')

  const unsafe = [
    '/saveGoNoGo?id=..%2F..%2Fescape&session=1',
    '/saveGoNoGo?session=1',
    '/saveFlanker?subject=..%2Fescape&session=1',
    '/saveColorStroop?subject=SYN001&session=..%2F..',
    '/saveEmotionalStroop?subject=%2Fetc&session=1',
    '/saveSquareCircleRating?id=..%2F..%2Fescape'
  ]
  for (const route of unsafe) {
    t.equal((await post(plain, route, row)).status, 400, `${route} -> 400`)
  }

  // A normal append is still written
  await post(plain, '/saveGoNoGo?id=SYN006&session=1&version=1', row)
  await sleep(200)
  t.ok(fs.existsSync(path.join(tasksDir, 'wave3-GT-SYN006-T1.csv')), 'normal GoNoGo row written')
  t.deepEqual(escaped, [], 'nothing thrown outside Express')
  t.end()
})

test('teardown', (t) => {
  plain.close()
  wired.close()
  process.chdir(cwd)
  process.removeListener('uncaughtException', onUncaught)
  fs.rmSync(scratch, { recursive: true, force: true })
  t.end()
})
