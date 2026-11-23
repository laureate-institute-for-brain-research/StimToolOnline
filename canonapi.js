// CANON functional session API
// Per-subject state for the CANON online session (see CANON_StimtoolOnline_Port/ONLINE_BUILD.md):
//  - the 6 memory sentences typed on the first page, read back by the two recall pages
//  - the condition study used at each visit, so a T2 visit can be checked for the opposite letter
// State lives in one JSON file per subject: $CANON_STATE_PATH or $DATA_PATH/CANON/state/<subject>.json
//
// Memory access control
//  A dashboard link id is NOT proof of being the participant: /adduser hands out a fresh link to
//  anyone who names a subject ID. So memories are guarded by two things:
//   1. They are stored per enrolment (subject + CANON condition study + session), never per
//      subject + session only. A link minted for another (or made-up) study reaches a different,
//      empty record.
//   2. Each enrolment's memories have a secret memory key. The first /saveCanonMemories for an
//      enrolment generates it and returns it once, to the browser that typed the memories. Only
//      its SHA-256 is stored. Reading the memories, or replacing them, needs the key. No endpoint
//      ever returns it again.
//  Staff can clear an enrolment's memories (for example after a change of computer mid-session)
//  with the authenticated POST /resetCanonMemories.
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

const models = require('./models')
const staffAuth = require('./authentication/basic.js')

const STATE_DIR = process.env.CANON_STATE_PATH || path.join(process.env.DATA_PATH || 'data', 'CANON', 'state')
const NUM_MEMORIES = 6
const MAX_MEMORY_LENGTH = 500

// The 24 CANON condition studies (CANON_{A|B}{1|2}_{HAPPY|SAD}_PM{1|2|3}) and their two visits.
// No other study/session ever gets CANON state.
const CANON_STUDY = /^CANON_[AB][12]_(HAPPY|SAD)_PM[123]$/
const CANON_SESSION = /^T[12]$/
const KEY_PATTERN = /^[0-9a-f]{64}$/ // 32 random bytes, hex

function safeName (subject) {
  const name = String(subject).replace(/[^A-Za-z0-9_-]/g, '_')
  // Different subjects must never share a file: when characters were replaced, add a hash of
  // the exact subject. Plain lab IDs keep their existing file name.
  if (name === String(subject)) return name
  return name + '-' + crypto.createHash('sha256').update(String(subject)).digest('hex').slice(0, 12)
}

function statePath (subject) {
  return path.join(STATE_DIR, safeName(subject) + '.json')
}

function readState (subject) {
  let state
  try {
    state = JSON.parse(fs.readFileSync(statePath(subject), 'utf8'))
  } catch (err) {
    state = null
  }
  if (state === null || typeof state !== 'object' || state.subject !== subject) {
    state = { subject }
  }
  // visits: pre-enrolment layout (kept for the letter check only; its memories are never served)
  if (!state.visits || typeof state.visits !== 'object') state.visits = {}
  if (!state.enrolments || typeof state.enrolments !== 'object') state.enrolments = {}
  return state
}

function writeState (subject, state) {
  fs.mkdirSync(STATE_DIR, { recursive: true })
  const target = statePath(subject)
  const tmp = target + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2))
  fs.renameSync(tmp, target) // atomic replace, so a crash never leaves half a file
}

// Schedule letter of a condition study name, e.g. CANON_A1_HAPPY_PM1 -> 'A'
function studyLetter (study) {
  const match = /^CANON_([AB])[12]_/.exec(String(study || ''))
  return match ? match[1] : null
}

function isCanonEnrolment (link) {
  return link != null &&
    typeof link.subject === 'string' && link.subject !== '' &&
    typeof link.study === 'string' && CANON_STUDY.test(link.study) &&
    typeof link.session === 'string' && CANON_SESSION.test(link.session)
}

function enrolmentKey (link) {
  return link.study + '/' + link.session
}

const hashKey = (key) => crypto.createHash('sha256').update(key, 'utf8').digest()

function keyMatches (record, key) {
  if (typeof key !== 'string' || !KEY_PATTERN.test(key)) return false
  if (typeof record.key_sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(record.key_sha256)) return false
  return crypto.timingSafeEqual(hashKey(key), Buffer.from(record.key_sha256, 'hex'))
}

// Resolve a session link (dashboard uuid) to its subject/study/session. Only plain strings are
// looked up; anything else could turn into an operator or an IN (...) list.
function findLink (id) {
  if (typeof id !== 'string' || id === '' || id.length > 100) return Promise.resolve(null)
  return models.dashboard.findOne({ where: { link: id } })
}

// Letters this subject has used, per session, from the enrolments with saved memories and from
// the pre-enrolment layout.
function lettersBySession (state) {
  const out = []
  for (const record of Object.values(state.enrolments)) {
    if (record && record.letter) out.push({ session: record.session, letter: record.letter })
  }
  for (const [session, visit] of Object.entries(state.visits)) {
    if (visit && visit.letter) out.push({ session, letter: visit.letter })
  }
  return out
}

module.exports = function (app) {
  // Save the participant's memory sentences for this enrolment.
  // First save: generates the memory key and returns it (only time it is ever sent).
  // Later saves (e.g. the entry page reloaded): must present that key.
  app.post('/saveCanonMemories', (req, res) => {
    const id = req.body.id
    const key = req.body.key
    const memories = req.body.memories
    if (!Array.isArray(memories) || memories.length !== NUM_MEMORIES ||
        !memories.every((m) => typeof m === 'string' && m.trim() !== '' && m.length <= MAX_MEMORY_LENGTH)) {
      return res.status(400).send({ message: 'expected ' + NUM_MEMORIES + ' non-empty memory sentences' })
    }
    if (key !== undefined && key !== null && key !== '' && (typeof key !== 'string' || !KEY_PATTERN.test(key))) {
      return res.status(400).send({ message: 'invalid memory key' })
    }
    findLink(id)
      .then((link) => {
        if (!isCanonEnrolment(link)) return res.status(404).send({ message: 'unknown link' })
        const state = readState(link.subject)
        const slot = enrolmentKey(link)
        const existing = state.enrolments[slot]
        let issued = null
        if (existing && existing.key_sha256) {
          if (!keyMatches(existing, key)) {
            logger.warn(`CANON memories save refused (no valid memory key): ${link.subject} ${slot}`)
            return res.status(403).send({ message: 'memories for this session were already saved from another browser' })
          }
        } else {
          issued = crypto.randomBytes(32).toString('hex')
        }
        const record = existing && existing.key_sha256 ? existing : { key_sha256: hashKey(issued).toString('hex') }
        record.study = link.study
        record.session = link.session
        record.letter = studyLetter(link.study)
        // one sentence per entry, no line breaks (recall indices depend on it)
        record.memories = memories.map((m) => m.replace(/[\r\n]+/g, ' ').trim())
        record.memories_saved_at = new Date().toISOString()
        state.enrolments[slot] = record
        writeState(link.subject, state)
        logger.info(`CANON memories saved: ${link.subject} ${slot}`)
        res.send(issued ? { message: 'ok', key: issued } : { message: 'ok' })
      })
      .catch((err) => {
        logger.error(err)
        res.status(500).send({ message: 'could not save memories' })
      })
  })

  // Return this enrolment's memory sentences to a recall page holding the memory key
  app.post('/getCanonMemories', (req, res) => {
    const id = req.body.id
    const key = req.body.key
    findLink(id)
      .then((link) => {
        if (!isCanonEnrolment(link)) return res.status(404).send({ message: 'unknown link' })
        const record = readState(link.subject).enrolments[enrolmentKey(link)]
        if (!record || !Array.isArray(record.memories)) return res.send({ memories: null })
        if (!keyMatches(record, key)) {
          logger.warn(`CANON memories read refused (no valid memory key): ${link.subject} ${enrolmentKey(link)}`)
          return res.status(403).send({ memories: null, message: 'memory key required' })
        }
        res.send({ memories: record.memories })
      })
      .catch((err) => {
        logger.error(err)
        res.status(500).send({ message: 'could not read memories' })
      })
  })

  // Staff only: forget an enrolment's memories and memory key, so the participant can enter
  // them again (e.g. after moving to another computer mid-session). Never returns the memories.
  app.post('/resetCanonMemories', staffAuth, (req, res) => {
    findLink(req.body.id)
      .then((link) => {
        if (!isCanonEnrolment(link)) return res.status(404).send({ message: 'unknown link' })
        const state = readState(link.subject)
        const slot = enrolmentKey(link)
        if (state.enrolments[slot]) {
          delete state.enrolments[slot]
          writeState(link.subject, state)
        }
        logger.info(`CANON memories reset by staff: ${link.subject} ${slot}`)
        res.send({ message: 'ok' })
      })
      .catch((err) => {
        logger.error(err)
        res.status(500).send({ message: 'could not reset memories' })
      })
  })

  // Landing page check: warn when a visit uses the same schedule letter as the other visit
  app.post('/checkCanonVisit', (req, res) => {
    const subject = typeof req.body.subject === 'string' ? req.sanitize(req.body.subject) : ''
    const session = typeof req.body.session === 'string' ? req.sanitize(req.body.session) : ''
    const letter = typeof req.body.study === 'string' && CANON_STUDY.test(req.body.study) ? studyLetter(req.body.study) : null
    if (!subject || !letter) return res.send({ warning: '' })
    for (const other of lettersBySession(readState(subject))) {
      if (other.session !== session && other.letter === letter) {
        return res.send({
          warning: `${subject} already completed ${other.session} with schedule letter ${letter}. ` +
            `This visit should use the other letter (${letter === 'A' ? 'B' : 'A'}). Please check the link.`
        })
      }
    }
    res.send({ warning: '' })
  })
}

// exported for tests
module.exports.CANON_STUDY = CANON_STUDY
module.exports.statePath = statePath
