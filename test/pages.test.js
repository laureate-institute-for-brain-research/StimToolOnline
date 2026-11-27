// Regression tests for the page-serving routes in api.js (CWE-248). A failed fs.readFile used to
// fall through to res.write(undefined), which throws from the fs callback, outside Express, and
// kills the only server process. The same applied to `if (err) throw err` in the save routes.
//
// Every page and data file here is synthetic and lives in a fresh temp directory.
//
//   npm test

const test = require('tape')
const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')
const { spawnSync } = require('child_process')

const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'pages-test-')))
process.env.LOG_LEVEL = 'silent'
process.env.KEYS_PATH = path.join(scratch, 'no-keys.json')

const express = require('express')
const bodyParser = require('body-parser')
const { isSafeName, handleRouteError } = require('../pages')

const API = path.join(__dirname, '..', 'api.js')

// scratch/
//   good/    every page the routes serve, except tooearly.html
//   empty/   no pages at all
//   work/    working directory for the save routes (no data/ directories)
const goodRoot = path.join(scratch, 'good')
const emptyRoot = path.join(scratch, 'empty')
const workDir = path.join(scratch, 'work')

const PAGES = {
  'index.html': 'SYNTH_HOME',
  '404.html': 'SYNTH_404',
  'completed.html': 'SYNTH_COMPLETED',
  'completedHIT.html': 'SYNTH_COMPLETED_HIT',
  'completedMobile.html': 'SYNTH_COMPLETED_MOBILE',
  'exclude.html': 'SYNTH_EXCLUDE',
  'surveys/square_circle.html': 'SYNTH_SQUARE_CIRCLE',
  'public/js/tasks/SYNTH_TASK/index.html': 'SYNTH_TASK_PAGE',
  'public/js/tasks/cooperation_task/index.html': 'SYNTH_COOP_PAGE',
  'public/js/surveys/SYNTH_SURVEY/index.html': 'SYNTH_SURVEY_PAGE',
  'task/gonogo/version_1/gonogo1.html': 'SYNTH_GONOGO_1',
  'task/chicken_task/estimate_version/pattern_1.html': 'SYNTH_CHICKEN_1',
  'task/chicken_task/estimate_version/pattern_2.html': 'SYNTH_CHICKEN_2',
  'secret/index.html': 'SYNTH_SECRET', // outside every served directory
  'public/js/secret/index.html': 'SYNTH_SECRET'
}
for (const [rel, body] of Object.entries(PAGES)) {
  const file = path.join(goodRoot, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `<p>${body}</p>`)
}
fs.mkdirSync(path.join(goodRoot, 'public/js/tasks/NO_INDEX'), { recursive: true }) // directory, no index.html
fs.writeFileSync(path.join(goodRoot, 'public/js/tasks/plain_file'), 'not a directory')
fs.mkdirSync(emptyRoot, { recursive: true })
fs.mkdirSync(workDir, { recursive: true })

// Anything thrown outside Express lands here instead of killing the test run
const escaped = []
const onUncaught = (err) => escaped.push(err)
process.on('uncaughtException', onUncaught)

function buildApp (pagesRoot) {
  const app = express()
  app.use(bodyParser.json({ limit: '1mb' }))
  require(API)(app, { pagesRoot })
  app.use(handleRouteError)
  return app
}

function listen (app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server))
  })
}

// Never rejects: a request the server never answers resolves as 'timeout'
function request (server, method, route, { body, headers = {} } = {}) {
  const { port } = server.address()
  const payload = body === undefined ? undefined : JSON.stringify(body)
  if (payload !== undefined) {
    headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers }
  }
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, path: route, method, headers }, (res) => {
      let text = ''
      res.setEncoding('utf8')
      res.on('data', (c) => { text += c })
      res.on('end', () => resolve({ status: res.statusCode, text, type: res.headers['content-type'] || '' }))
      res.on('error', () => resolve({ status: 'aborted', text }))
    })
    req.setTimeout(3000, () => { req.destroy(); resolve({ status: 'timeout', text: '' }) })
    req.on('error', (err) => resolve({ status: 'error:' + err.code, text: '' }))
    req.end(payload)
  })
}
const get = (server, route, headers) => request(server, 'GET', route, { headers })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Records every path passed to fs.readFile while active
function spyReadFile () {
  const calls = []
  const orig = fs.readFile
  fs.readFile = function (p, ...rest) {
    calls.push(String(p))
    return orig.call(this, p, ...rest)
  }
  return { calls, restore: () => { fs.readFile = orig } }
}

async function assertHealthy (t, server, label) {
  const r = await get(server, '/')
  t.equal(r.status, 200, `${label}: server still serves GET /`)
  t.ok(r.text.includes('SYNTH_HOME'), `${label}: home page content`)
}

const q = (params) => '/?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')

let good, empty

test('setup', async (t) => {
  good = await listen(buildApp(goodRoot))
  empty = await listen(buildApp(emptyRoot))
  t.end()
})

test('isSafeName accepts one plain path component only', (t) => {
  for (const ok of ['SYNTH_TASK', 'version_1', 'a.b', 'a-b', '1', 'x'.repeat(128)]) {
    t.ok(isSafeName(ok), `${JSON.stringify(ok)} accepted`)
  }
  for (const bad of ['', '.', '..', '.hidden', 'a/b', 'a\\b', '../x', '..\\x', 'a\u0000b', '%2e%2e', 'a b',
    'x'.repeat(129), undefined, null, 3, ['SYNTH_TASK'], { a: 1 }]) {
    t.notOk(isSafeName(bad), `${JSON.stringify(bad)} rejected`)
  }
  t.end()
})

test('existing pages are still served as before', async (t) => {
  const cases = [
    ['/', 'SYNTH_HOME'],
    [q({ task: 'SYNTH_TASK' }), 'SYNTH_TASK_PAGE'],
    [q({ survey: 'SYNTH_SURVEY' }), 'SYNTH_SURVEY_PAGE'],
    ['/completed', 'SYNTH_COMPLETED'],
    ['/completedHIT', 'SYNTH_COMPLETED_HIT'],
    ['/completeMobile', 'SYNTH_COMPLETED_MOBILE'],
    ['/exclude', 'SYNTH_EXCLUDE'],
    ['/square_circle_rating', 'SYNTH_SQUARE_CIRCLE'],
    ['/gonogo?version=1', 'SYNTH_GONOGO_1'],
    ['/chicken_estimate', 'SYNTH_CHICKEN_1'],
    ['/chicken_estimate?pattern=2', 'SYNTH_CHICKEN_2'],
    ['/no/such/route', 'SYNTH_404'] // catch-all keeps its existing 200 status
  ]
  for (const [route, marker] of cases) {
    const r = await get(good, route)
    t.equal(r.status, 200, `${route} -> 200`)
    t.ok(r.text.includes(marker), `${route} body`)
    t.ok(r.type.startsWith('text/html'), `${route} content type`)
  }
  t.end()
})

test('cooperation_task still requires its password', async (t) => {
  const saved = { u: process.env.IAPS_USER, p: process.env.IAPS_PASSWORD }
  process.env.IAPS_USER = 'synth_user'
  process.env.IAPS_PASSWORD = 'synth-pass-' + Date.now()
  const auth = 'Basic ' + Buffer.from(`${process.env.IAPS_USER}:${process.env.IAPS_PASSWORD}`).toString('base64')

  t.equal((await get(good, q({ task: 'cooperation_task' }))).status, 401, 'no credentials -> 401')
  const ok = await get(good, q({ task: 'cooperation_task' }), { Authorization: auth })
  t.equal(ok.status, 200, 'credentials -> 200')
  t.ok(ok.text.includes('SYNTH_COOP_PAGE'))
  // A case variant used to reach the same directory on case-insensitive file systems without the password
  for (const variant of ['COOPERATION_TASK', 'Cooperation_Task']) {
    const r = await get(good, q({ task: variant }))
    t.equal(r.status, 404, `${variant} without credentials -> 404`)
    t.notOk(r.text.includes('SYNTH_COOP_PAGE'))
  }

  if (saved.u === undefined) delete process.env.IAPS_USER; else process.env.IAPS_USER = saved.u
  if (saved.p === undefined) delete process.env.IAPS_PASSWORD; else process.env.IAPS_PASSWORD = saved.p
  t.end()
})

test('the requests from the finding return an error status and the server keeps serving', async (t) => {
  const routes = [
    q({ task: 'NO_SUCH_TASK' }),
    q({ survey: 'NO_SUCH_SURVEY' }),
    '/tooearly', // tooearly.html does not exist (as in the repository)
    '/chicken_estimate?pattern=9',
    '/gonogo?version=9',
    '/gonogo' // no version at all
  ]
  for (const route of routes) {
    const r = await get(good, route)
    t.equal(r.status, 404, `${route} -> 404`)
    t.deepEqual(escaped, [], `${route}: nothing thrown outside Express`)
    await assertHealthy(t, good, route)
  }

  // Repeated and concurrent, mixed with normal traffic
  const results = await Promise.all([
    ...Array.from({ length: 20 }, () => get(good, '/tooearly')),
    ...Array.from({ length: 20 }, (_, i) => get(good, q({ task: 'NO_SUCH_' + i }))),
    ...Array.from({ length: 10 }, () => get(good, q({ task: 'SYNTH_TASK' })))
  ])
  t.ok(results.slice(0, 40).every((r) => r.status === 404), '40 concurrent bad requests -> 404')
  t.ok(results.slice(40).every((r) => r.status === 200 && r.text.includes('SYNTH_TASK_PAGE')), 'concurrent good requests -> 200')
  t.deepEqual(escaped, [], 'nothing thrown outside Express')
  t.end()
})

test('task/survey names are matched against existing directories before any file read', async (t) => {
  const names = [
    '..', '.', '../secret', '../../secret', '../../../secret', '../../../../secret',
    'SYNTH_TASK/../../secret', 'SYNTH_TASK/../../../../secret', '..\\..\\..\\secret',
    path.join(goodRoot, 'secret'), '/etc', '%2e%2e%2fsecret', 'a\u0000b', '.hidden',
    'synth_task', 'SYNTH_TASK ', 'plain_file', 'NO_SUCH_TASK', 'x'.repeat(5000)
  ]
  const spy = spyReadFile()
  for (const field of ['task', 'survey']) {
    for (const name of names) {
      const r = await get(good, q({ [field]: name }))
      t.equal(r.status, 404, `${field}=${JSON.stringify(name).slice(0, 60)} -> 404`)
      t.notOk(r.text.includes('SYNTH_SECRET'), 'no file outside the served directory')
    }
    // Repeated parameter (parsed as an array)
    const r = await get(good, `/?${field}=SYNTH_TASK&${field}=SYNTH_SURVEY`)
    t.equal(r.status, 404, `${field} given twice -> 404`)
  }
  spy.restore()
  t.deepEqual(spy.calls, [], 'no fs.readFile for any rejected name')

  // A matching directory without index.html is a per-request 404
  const r = await get(good, q({ task: 'NO_INDEX' }))
  t.equal(r.status, 404, 'directory without index.html -> 404')
  t.deepEqual(escaped, [], 'nothing thrown outside Express')
  await assertHealthy(t, good, 'after name checks')
  t.end()
})

test('every page route returns 404 (not a crash) when its file is missing', async (t) => {
  const routes = ['/', '/completed', '/completedHIT', '/completeMobile', '/exclude', '/square_circle_rating',
    '/tooearly', '/chicken_estimate', '/gonogo?version=1', q({ task: 'SYNTH_TASK' }), q({ survey: 'SYNTH_SURVEY' }),
    '/no/such/route']
  for (const route of routes) {
    const r = await get(empty, route)
    t.equal(r.status, 404, `${route} with no pages -> 404`)
  }
  t.deepEqual(escaped, [], 'nothing thrown outside Express')
  await assertHealthy(t, good, 'other server')
  t.end()
})

test('other read errors become a 500 for that request only', async (t) => {
  const orig = fs.readFile
  fs.readFile = function (p, ...rest) {
    if (String(p).endsWith('completed.html')) {
      const cb = rest[rest.length - 1]
      return process.nextTick(cb, Object.assign(new Error('synthetic permission error'), { code: 'EACCES' }))
    }
    return orig.call(this, p, ...rest)
  }
  const r = await get(good, '/completed')
  fs.readFile = orig
  t.equal(r.status, 500, 'EACCES -> 500')
  t.notOk(r.text.includes('synthetic permission error'), 'error details not sent to the client')
  t.deepEqual(escaped, [], 'nothing thrown outside Express')
  await assertHealthy(t, good, 'after EACCES')
  t.end()
})

test('save routes: a failed write is logged, not thrown from the fs callback', async (t) => {
  // workDir has no data/ directories, so every write below fails with ENOENT
  const cwd = process.cwd()
  process.chdir(workDir)
  const ua = { 'User-Agent': 'synthetic-agent' }
  const row = [{ trial_index: 1, trial_type: 'synth', trial_number: 1, test_part: 'test', result: 'ok', time_elapsed: 10, rt: 5, key_press: 1, outcome: 'x', points: 0 }]
  try {
    await request(good, 'POST', '/saveGoNoGo?id=SYN001&session=1&version=1', { body: row, headers: ua })
    await request(good, 'POST', '/saveFlanker?subject=SYN001&session=1&version=1', { body: row, headers: ua })
    await request(good, 'POST', '/saveColorStroop?subject=SYN001&session=1&version=1', { body: row, headers: ua })
    await request(good, 'POST', '/saveEmotionalStroop?subject=SYN001&session=1&version=1', { body: row, headers: ua })
    // These two are refused before writing (study SYNTH has no data directory; see legacyresults.test.js)
    await request(good, 'POST', '/saveDPTask/?study=SYNTH&session=1&mkturk_id=SYN001&task=dp', { body: { content: 'x' }, headers: ua })
    await request(good, 'POST', '/saveChickenTask/?study=SYNTH&session=2&mkturk_id=SYN001&task=ct', { body: { content: '' }, headers: ua })
    await sleep(300) // let the write callbacks run
  } finally {
    process.chdir(cwd)
  }
  t.deepEqual(fs.readdirSync(workDir), [], 'nothing was written')
  t.deepEqual(escaped, [], 'nothing thrown outside Express')
  await assertHealthy(t, good, 'after failed saves')
  t.end()
})

test('/saveSquareCircleRating: a repeated id never blocks the server or overwrites the first file', (t) => {
  // Runs in a child process: the old handler spun forever in `while (err == null)` once the file
  // existed, which would freeze this test process too.
  const RESULT_MARKER = '@@SC_RESULT@@'
  const dir = path.join(scratch, 'sc-work')
  fs.mkdirSync(path.join(dir, 'data', 'square_circle_rating'), { recursive: true })
  const script = `
    process.env.LOG_LEVEL = 'silent'
    process.env.KEYS_PATH = ${JSON.stringify(process.env.KEYS_PATH)}
    const http = require('http')
    const fs = require('fs')
    const express = require(${JSON.stringify(require.resolve('express'))})
    const bodyParser = require(${JSON.stringify(require.resolve('body-parser'))})
    const app = express()
    app.use(bodyParser.json())
    require(${JSON.stringify(API)})(app, { pagesRoot: ${JSON.stringify(emptyRoot)} })
    const post = (port, body) => new Promise((resolve) => {
      const payload = JSON.stringify(body)
      const req = http.request({ host: '127.0.0.1', port, path: '/saveSquareCircleRating?id=SYN001', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
        (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)) })
      req.end(payload)
    })
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const server = app.listen(0, '127.0.0.1', async () => {
      const { port } = server.address()
      const statuses = []
      statuses.push(await post(port, { rating: 'FIRST' }))
      await sleep(200)
      statuses.push(await post(port, { rating: 'SECOND' }))
      await sleep(200)
      statuses.push(await post(port, { rating: 'THIRD' }))
      await sleep(200)
      const d = 'data/square_circle_rating'
      const files = fs.readdirSync(d).sort().map((f) => [f, fs.readFileSync(d + '/' + f, 'utf8')])
      // After a marker: the route's console.log output shares this stdout
      process.stdout.write('\\n${RESULT_MARKER}' + JSON.stringify({ statuses, files }), () => process.exit(0))
    })
  `
  const child = spawnSync(process.execPath, ['-e', script], { cwd: dir, timeout: 15000, encoding: 'utf8' })
  t.equal(child.status, 0, 'child finished (server not frozen)')
  let out = { statuses: [], files: [] }
  const stdout = child.stdout || ''
  const at = stdout.lastIndexOf(RESULT_MARKER)
  try {
    if (at < 0) throw new Error('no result marker')
    out = JSON.parse(stdout.slice(at + RESULT_MARKER.length))
  } catch (e) {
    t.fail('no result from child: ' + stdout.slice(-500) + ' / ' + (child.stderr || '').slice(-500))
  }
  t.deepEqual(out.statuses, [200, 200, 200], 'all three requests answered')
  t.equal(out.files.length, 3, 'three separate files')
  const first = out.files.find(([f]) => f === 'sc-SYN001.csv')
  t.ok(first && first[1].includes('FIRST'), 'first file kept its own data')
  for (const word of ['FIRST', 'SECOND', 'THIRD']) {
    t.equal(out.files.filter(([, c]) => c.includes(word)).length, 1, `${word} saved exactly once`)
  }
  t.end()
})

test('teardown', (t) => {
  good.close()
  empty.close()
  process.removeListener('uncaughtException', onUncaught)
  fs.rmSync(scratch, { recursive: true, force: true })
  t.end()
})
