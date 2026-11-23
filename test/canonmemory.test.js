// Regression tests for the CANON memory IDOR (CWE-639).
//
// /getCanonMemories and /saveCanonMemories used to accept any dashboard link id as proof of being
// the participant, and resolved it to <subject>.json visits[session] (study ignored). Link ids were
// handed to anyone who named a subject ID: /adduser created a fresh row (and link) for any
// subject/study/session and returned the existing row's link on a repeat; /getSubjectInfo returned
// every row, with links, for a subject. So knowing a subject ID was enough to read or overwrite
// that participant's six autobiographical memory sentences.
//
// The attacker in these tests knows only the victim's subject ID (and the public study names) and
// uses the unauthenticated routes freely.
//
// Runs the real routes from stimtoolapi.js and canonapi.js on a local, throwaway Express app with an
// in-memory stand-in for the dashboard table. No database is contacted. CANON state goes to a temp
// directory. All data is synthetic and removed in teardown.
//
//   npm test

const test = require('tape')
const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')
const crypto = require('crypto')

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'canonmemory-test-'))
const STATE_DIR = path.join(scratch, 'state')

const express = require('express')
const bodyParser = require('body-parser')
const expressSanitizer = require('express-sanitizer')
const models = require('../models')

const hex = (n = 6) => crypto.randomBytes(n).toString('hex')

// ---- in-memory dashboard table (installed in setup, restored in teardown) -------------------
const rows = []
const matches = (row, where) => Object.keys(where).every((k) => row[k] === where[k])
const stubDashboard = {
  findOne: async ({ where }) => {
    // Sequelize would reject or reinterpret non-primitive values; the stub only matches primitives
    if (Object.values(where).some((v) => v === undefined || (v !== null && typeof v === 'object'))) {
      throw new Error('non-primitive where value')
    }
    return rows.find((r) => matches(r, where)) || null
  },
  findAll: async ({ where }) => rows.filter((r) => matches(r, where)),
  create: async (values) => {
    const row = { id: rows.length + 1, email: null, phone: null, completed: false, ...values }
    rows.push(row)
    return row
  }
}
let savedDashboard
const savedEnv = {}
const ENV = ['CANON_STATE_PATH', 'DASHBOARD_USER', 'DASHBOARD_PASSWORD', 'LOG_LEVEL']

// Synthetic staff credentials, generated per run
const STAFF_USER = 'synthstaff_' + hex()
const STAFF_PASS = hex(16)
const staffHeader = 'Basic ' + Buffer.from(STAFF_USER + ':' + STAFF_PASS).toString('base64')
const wrongHeader = 'Basic ' + Buffer.from('someone:' + hex(16)).toString('base64')

// ---- helpers ------------------------------------------------------------------------------
function listen (app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function post (server, route, body, { form = false, auth } = {}) {
  const payload = form ? new URLSearchParams(body).toString() : JSON.stringify(body)
  const { port } = server.address()
  const headers = {
    'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
  if (auth) headers.Authorization = auth
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: route, method: 'POST', headers }, (res) => {
      let text = ''
      res.on('data', (c) => { text += c })
      res.on('end', () => {
        let json = null
        try { json = JSON.parse(text) } catch (err) { /* not JSON */ }
        resolve({ status: res.statusCode, text, json })
      })
    })
    req.on('error', reject)
    req.end(payload)
  })
}

// The 24 CANON condition studies (as shipped in public/study/)
const CANON_STUDIES = []
for (const letter of ['A', 'B']) {
  for (const outlist of ['1', '2']) {
    for (const valence of ['HAPPY', 'SAD']) {
      for (const pm of ['1', '2', '3']) CANON_STUDIES.push(`CANON_${letter}${outlist}_${valence}_PM${pm}`)
    }
  }
}

const memoriesFor = (who) => Array.from({ length: 6 }, (_, i) => `SYNTH ${who} memory ${i + 1} ${hex()}`)

// ---- victim: a real enrolment, created and filled in by the participant's browser -----------
const VICTIM = 'SYNTHV' + hex()
const VICTIM_STUDY = 'CANON_A1_HAPPY_PM1'
const VICTIM_SESSION = 'T1'
const VICTIM_MEMORIES = memoriesFor('victim')
let victimLink
let victimKey

let server
let canonapi

test('setup', async (t) => {
  for (const k of ENV) savedEnv[k] = process.env[k]
  process.env.CANON_STATE_PATH = STATE_DIR
  process.env.DASHBOARD_USER = STAFF_USER
  process.env.DASHBOARD_PASSWORD = STAFF_PASS
  process.env.LOG_LEVEL = 'silent'
  savedDashboard = models.dashboard
  models.dashboard = stubDashboard

  canonapi = require('../canonapi.js')
  t.equal(canonapi.statePath('x').startsWith(STATE_DIR), true, 'state goes to the temp directory')

  const app = express()
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(expressSanitizer())
  require('../stimtoolapi.js')(app)
  canonapi(app)
  server = await listen(app)

  // The participant's landing page and entry page
  let r = await post(server, '/adduser', { subject: VICTIM, study: VICTIM_STUDY, session: VICTIM_SESSION }, { form: true })
  t.equal(r.json.message, 'ok')
  victimLink = r.json.info.link
  t.match(victimLink, /^[0-9a-f-]{36}$/, 'creator of the row gets its link')

  r = await post(server, '/saveCanonMemories', { id: victimLink, memories: VICTIM_MEMORIES })
  t.equal(r.status, 200)
  victimKey = r.json.key
  t.match(victimKey, /^[0-9a-f]{64}$/, 'first save issues a memory key')

  r = await post(server, '/getCanonMemories', { id: victimLink, key: victimKey })
  t.deepEqual(r.json.memories, VICTIM_MEMORIES, 'participant reads their memories back with the key')
  t.end()
})

const containsVictimSecret = (text) =>
  text.includes(victimLink) || text.includes(victimKey) || VICTIM_MEMORIES.some((m) => text.includes(m))

async function victimMemoriesNow () {
  const r = await post(server, '/getCanonMemories', { id: victimLink, key: victimKey })
  return r.json.memories
}

// ---- criterion 3: no unauthenticated lookup returns an existing row's link -----------------

test('/adduser repeat for an existing enrolment does not reveal its link', async (t) => {
  for (const asForm of [true, false]) {
    const r = await post(server, '/adduser', { subject: VICTIM, study: VICTIM_STUDY, session: VICTIM_SESSION }, { form: asForm })
    t.equal(r.status, 200)
    t.equal(r.json.message, 'subject/study/session already exists in database')
    t.notOk(r.json.info && r.json.info.link, 'no link in the response')
    t.notOk(containsVictimSecret(r.text), 'response does not contain the link')
    t.deepEqual(Object.keys(r.json.info).sort(), ['session', 'study', 'subject'], 'only the values that were sent')
  }
  t.end()
})

test('/getSubjectInfo is staff-only', async (t) => {
  for (const auth of [undefined, wrongHeader, 'Basic ' + Buffer.from(':' + STAFF_PASS).toString('base64'),
    'Basic ' + Buffer.from(STAFF_USER + ':').toString('base64')]) {
    const r = await post(server, '/getSubjectInfo', { subject: VICTIM }, { auth })
    t.equal(r.status, 401, `refused with ${auth ? 'bad' : 'no'} credentials`)
    t.notOk(containsVictimSecret(r.text), 'no link disclosed')
  }
  const r = await post(server, '/getSubjectInfo', { subject: VICTIM }, { auth: staffHeader })
  t.equal(r.status, 200, 'staff still get the rows')
  t.ok(r.text.includes(victimLink), 'staff can recover the link')
  t.end()
})

test('/getInfo only answers a caller holding the link, and only with the page fields', async (t) => {
  const probes = [
    { subject: VICTIM },
    { id: VICTIM },
    { id: 1 },
    { id: [victimLink.slice(0, 8)] },
    { id: {} },
    { id: null },
    {},
    { id: '' }
  ]
  for (const body of probes) {
    const r = await post(server, '/getInfo', body)
    t.notOk(containsVictimSecret(r.text), `/getInfo ${JSON.stringify(body)} reveals nothing`)
  }
  const r = await post(server, '/getInfo', { id: victimLink })
  t.deepEqual(Object.keys(r.json).sort(), ['link', 'session', 'study', 'subject'], 'no email/phone/id/timestamps')
  t.end()
})

test('/mturklink repeat does not send the existing link to caller-supplied contact details', async (t) => {
  // sendLink() would use result.email / result.phone; make sure the request values are not
  // copied onto the existing row before it is sent
  const before = rows.find((r) => r.link === victimLink)
  const email = before.email
  const phone = before.phone
  await post(server, '/mturklink', {
    subject: VICTIM, study: VICTIM_STUDY, session: VICTIM_SESSION,
    email: 'attacker@example.invalid', phone: '+10000000000', link_type: 'email'
  }, { form: true })
  await new Promise((resolve) => setTimeout(resolve, 50))
  t.equal(before.email, email, 'stored email unchanged / not replaced by the request')
  t.equal(before.phone, phone, 'stored phone unchanged / not replaced by the request')
  t.end()
})

// ---- criteria 1 and 2: freshly minted links never reach the victim's memories ----------------

test('links minted for the victim subject under every other CANON study/session cannot read or change the memories', async (t) => {
  const minted = []
  for (const study of CANON_STUDIES) {
    for (const session of ['T1', 'T2']) {
      const r = await post(server, '/adduser', { subject: VICTIM, study, session }, { form: true })
      if (study === VICTIM_STUDY && session === VICTIM_SESSION) {
        t.notOk(r.json.info.link, 'the real enrolment cannot be minted again')
        continue
      }
      t.equal(r.json.message, 'ok')
      minted.push({ study, session, link: r.json.info.link })
    }
  }
  t.equal(minted.length, CANON_STUDIES.length * 2 - 1)

  const attackerMemories = memoriesFor('attacker')
  for (const { study, session, link } of minted) {
    const label = `${study} ${session}`
    // what /getInfo tells the attacker about the minted link: only their own row
    const info = await post(server, '/getInfo', { id: link })
    t.notOk(containsVictimSecret(info.text), `${label}: /getInfo reveals nothing of the victim's`)

    let r = await post(server, '/getCanonMemories', { id: link })
    t.equal(r.json.memories, null, `${label}: reads back null`)
    t.notOk(containsVictimSecret(r.text), `${label}: no memories in the response`)
    r = await post(server, '/getCanonMemories', { id: link, key: victimKey.replace(/./, (c) => c === '0' ? '1' : '0') })
    t.equal(r.json.memories, null, `${label}: reads back null with a guessed key`)

    r = await post(server, '/saveCanonMemories', { id: link, memories: attackerMemories })
    t.equal(r.status, 200, `${label}: the save only lands in the attacker's own enrolment`)
    t.deepEqual(await victimMemoriesNow(), VICTIM_MEMORIES, `${label}: victim's memories unchanged`)
  }
  t.end()
})

test('the victim\'s own link without the memory key can neither read nor overwrite', async (t) => {
  // Defence in depth: even a leaked link (URL, history, logs) is not enough
  const guesses = [undefined, '', 'x', hex(32), victimKey.toUpperCase(), victimKey + '0', [victimKey], { k: victimKey }]
  for (const key of guesses) {
    let r = await post(server, '/getCanonMemories', { id: victimLink, key })
    t.notEqual(r.status, 200, `read with key ${JSON.stringify(key)} refused`)
    t.notOk(VICTIM_MEMORIES.some((m) => r.text.includes(m)), 'no memories in the response')
    r = await post(server, '/saveCanonMemories', { id: victimLink, key, memories: memoriesFor('attacker') })
    t.notEqual(r.status, 200, `overwrite with key ${JSON.stringify(key)} refused`)
    t.notOk(r.json && r.json.key, 'no new key issued')
  }
  t.deepEqual(await victimMemoriesNow(), VICTIM_MEMORIES, 'victim\'s memories unchanged')
  t.end()
})

test('rows for non-CANON or made-up studies never reach CANON state', async (t) => {
  // e.g. a legacy row, or one written before /adduser checked study names
  const made = []
  for (const [study, session] of [
    ['Made_Up_Study', VICTIM_SESSION],
    [VICTIM_STUDY + '_X', VICTIM_SESSION],
    ['canon_a1_happy_pm1', VICTIM_SESSION],
    [VICTIM_STUDY, 'T3'],
    [VICTIM_STUDY, VICTIM_SESSION.toLowerCase()],
    ['AAC-BET', 'T2']
  ]) {
    const link = crypto.randomUUID()
    rows.push({ subject: VICTIM, study, session, link })
    made.push(link)
  }
  for (const link of made) {
    let r = await post(server, '/getCanonMemories', { id: link, key: victimKey })
    t.equal(r.status, 404)
    t.notOk(containsVictimSecret(r.text))
    r = await post(server, '/saveCanonMemories', { id: link, memories: memoriesFor('attacker') })
    t.equal(r.status, 404)
  }
  t.deepEqual(await victimMemoriesNow(), VICTIM_MEMORIES)
  t.end()
})

test('state file keeps only a hash of the memory key', (t) => {
  const text = fs.readFileSync(canonapi.statePath(VICTIM), 'utf8')
  t.notOk(text.includes(victimKey), 'key itself is not stored')
  const state = JSON.parse(text)
  t.deepEqual(state.enrolments[`${VICTIM_STUDY}/${VICTIM_SESSION}`].memories, VICTIM_MEMORIES)
  t.end()
})

// ---- legitimate use still works ---------------------------------------------------------------

test('the participant can save again with their key (entry page reloaded)', async (t) => {
  const updated = memoriesFor('victim-again')
  const r = await post(server, '/saveCanonMemories', { id: victimLink, key: victimKey, memories: updated })
  t.equal(r.status, 200)
  t.notOk(r.json.key, 'no new key on a keyed save')
  t.deepEqual((await post(server, '/getCanonMemories', { id: victimLink, key: victimKey })).json.memories, updated)
  // put the original back for later tests
  await post(server, '/saveCanonMemories', { id: victimLink, key: victimKey, memories: VICTIM_MEMORIES })
  t.end()
})

test('/resetCanonMemories is staff-only and lets the participant start over', async (t) => {
  let r = await post(server, '/resetCanonMemories', { id: victimLink })
  t.equal(r.status, 401, 'refused without credentials')
  r = await post(server, '/resetCanonMemories', { id: victimLink }, { auth: wrongHeader })
  t.equal(r.status, 401, 'refused with wrong credentials')
  t.deepEqual(await victimMemoriesNow(), VICTIM_MEMORIES, 'nothing cleared')

  r = await post(server, '/resetCanonMemories', { id: victimLink }, { auth: staffHeader })
  t.equal(r.status, 200)
  t.notOk(VICTIM_MEMORIES.some((m) => r.text.includes(m)), 'reset does not return the memories')
  r = await post(server, '/getCanonMemories', { id: victimLink, key: victimKey })
  t.equal(r.json.memories, null, 'memories gone')

  const fresh = memoriesFor('victim-new-computer')
  r = await post(server, '/saveCanonMemories', { id: victimLink, memories: fresh })
  t.equal(r.status, 200)
  t.match(r.json.key, /^[0-9a-f]{64}$/, 'a new key is issued')
  t.notEqual(r.json.key, victimKey)
  t.deepEqual((await post(server, '/getCanonMemories', { id: victimLink, key: r.json.key })).json.memories, fresh)
  t.end()
})

test('memories saved in the old subject+session layout are never served', async (t) => {
  const subject = 'SYNTHL' + hex()
  const legacy = memoriesFor('legacy')
  fs.mkdirSync(STATE_DIR, { recursive: true })
  fs.writeFileSync(canonapi.statePath(subject), JSON.stringify({
    subject,
    visits: { T1: { study: 'CANON_B2_SAD_PM3', letter: 'B', memories: legacy } }
  }))
  // same study and session as the legacy record
  const r1 = await post(server, '/adduser', { subject, study: 'CANON_B2_SAD_PM3', session: 'T1' }, { form: true })
  const r = await post(server, '/getCanonMemories', { id: r1.json.info.link })
  t.equal(r.json.memories, null)
  t.notOk(legacy.some((m) => r.text.includes(m)))
  t.end()
})

test('/checkCanonVisit still warns about a repeated schedule letter', async (t) => {
  // victim saved T1 under letter A (and the attacker's saves added more letters, which can only
  // add warnings, never hide one)
  const fresh = 'SYNTHC' + hex()
  let r = await post(server, '/adduser', { subject: fresh, study: 'CANON_A2_SAD_PM2', session: 'T1' }, { form: true })
  await post(server, '/saveCanonMemories', { id: r.json.info.link, memories: memoriesFor('c') })
  r = await post(server, '/checkCanonVisit', { subject: fresh, session: 'T2', study: 'CANON_A1_HAPPY_PM3' })
  t.ok(r.json.warning.includes('letter A'), 'same letter at T2 -> warning')
  r = await post(server, '/checkCanonVisit', { subject: fresh, session: 'T2', study: 'CANON_B1_HAPPY_PM3' })
  t.equal(r.json.warning, '', 'other letter at T2 -> no warning')
  r = await post(server, '/checkCanonVisit', { subject: fresh, session: 'T1', study: 'CANON_A1_HAPPY_PM3' })
  t.equal(r.json.warning, '', 'same visit -> no warning')
  t.end()
})

test('teardown', (t) => {
  server.close()
  models.dashboard = savedDashboard
  for (const k of ENV) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
  fs.rmSync(scratch, { recursive: true, force: true })
  t.end()
})
