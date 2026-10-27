// CANON functional session API
// Per-subject state for the CANON online session (see CANON_StimtoolOnline_Port/ONLINE_BUILD.md):
//  - the 6 memory sentences typed on the first page, read back by the two recall pages
//  - the condition study used at each visit, so a T2 visit can be checked for the opposite letter
// State lives in one JSON file per subject: $CANON_STATE_PATH or $DATA_PATH/CANON/state/<subject>.json
const fs = require('fs')
const path = require('path')
const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

const models = require('./models')

const STATE_DIR = process.env.CANON_STATE_PATH || path.join(process.env.DATA_PATH || 'data', 'CANON', 'state')
const NUM_MEMORIES = 6
const MAX_MEMORY_LENGTH = 500

function safeName (subject) {
  return String(subject).replace(/[^A-Za-z0-9_-]/g, '_')
}

function statePath (subject) {
  return path.join(STATE_DIR, safeName(subject) + '.json')
}

function readState (subject) {
  try {
    return JSON.parse(fs.readFileSync(statePath(subject), 'utf8'))
  } catch (err) {
    return { subject, visits: {} }
  }
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

// Resolve a session link (dashboard uuid) to its subject/study/session
function findLink (id) {
  return models.dashboard.findOne({ where: { link: id } })
}

module.exports = function (app) {
  // Save the participant's memory sentences for this visit
  app.post('/saveCanonMemories', (req, res) => {
    const id = req.sanitize(req.body.id)
    const memories = req.body.memories
    if (!Array.isArray(memories) || memories.length !== NUM_MEMORIES ||
        !memories.every((m) => typeof m === 'string' && m.trim() !== '' && m.length <= MAX_MEMORY_LENGTH)) {
      return res.status(400).send({ message: 'expected ' + NUM_MEMORIES + ' non-empty memory sentences' })
    }
    findLink(id)
      .then((link) => {
        if (link == null) return res.status(404).send({ message: 'unknown link' })
        const state = readState(link.subject)
        const visit = state.visits[link.session] || {}
        visit.study = link.study
        visit.letter = studyLetter(link.study)
        // one sentence per entry, no line breaks (recall indices depend on it)
        visit.memories = memories.map((m) => m.replace(/[\r\n]+/g, ' ').trim())
        visit.memories_saved_at = new Date().toISOString()
        state.visits[link.session] = visit
        writeState(link.subject, state)
        logger.info(`CANON memories saved: ${link.subject} ${link.session}`)
        res.send({ message: 'ok' })
      })
      .catch((err) => {
        logger.error(err)
        res.status(500).send({ message: 'could not save memories' })
      })
  })

  // Return this visit's memory sentences to a recall page
  app.post('/getCanonMemories', (req, res) => {
    const id = req.sanitize(req.body.id)
    findLink(id)
      .then((link) => {
        if (link == null) return res.status(404).send({ message: 'unknown link' })
        const visit = readState(link.subject).visits[link.session]
        res.send({ memories: visit && visit.memories ? visit.memories : null })
      })
      .catch((err) => {
        logger.error(err)
        res.status(500).send({ message: 'could not read memories' })
      })
  })

  // Landing page check: warn when a visit uses the same schedule letter as the other visit
  app.post('/checkCanonVisit', (req, res) => {
    const subject = req.sanitize(req.body.subject || '')
    const session = req.sanitize(req.body.session || '')
    const letter = studyLetter(req.sanitize(req.body.study || ''))
    if (!subject || !letter) return res.send({ warning: '' })
    const visits = readState(subject).visits
    for (const other of Object.keys(visits)) {
      if (other !== session && visits[other].letter === letter) {
        return res.send({
          warning: `${subject} already completed ${other} with schedule letter ${letter}. ` +
            `This visit should use the other letter (${letter === 'A' ? 'B' : 'A'}). Please check the link.`
        })
      }
    }
    res.send({ warning: '' })
  })
}
