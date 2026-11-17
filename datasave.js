// Saving task results: POST /save, /savecoop and /saveAudio.
//
// The request decides *what* a file is called, never *where* it goes:
//   - every name field (task, participant, session, run_id, date, block) is reduced to a
//     single path component from [A-Za-z0-9_.-]: no separators, no "..", no leading dot,
//     bounded length;
//   - `study` must be the name of an existing directory directly under DATA_PATH,
//     otherwise the file goes to the fallback directory (data/free);
//   - the resolved path is checked to sit directly inside the chosen directory before
//     any write.
//
// Overwrite rules:
//   - /savecoop and /saveAudio never replace a file they did not create. A new result
//     whose name is already taken gets a random suffix.
//   - /savecoop clients re-send the whole run after every trial. They send a random
//     `save_token` that stays the same for one run. The server remembers which file
//     that token created and updates only that file. A request with a different token,
//     or with none, cannot touch it.
//   - /save keeps its old behaviour (later saves replace the file with the same name).
//     About 100 pages call it with cumulative data; see the PR notes.

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const jsonexport = require('jsonexport')
const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

const COMPONENT_MAX = 40 // 5 fields * 40 + separators + suffix stays well under 255 bytes
const STUDY_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/
const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/
const CREATE_ATTEMPTS = 5
const RUN_TTL_MS = 24 * 60 * 60 * 1000
const MAX_TRACKED_RUNS = 50000
// Missing or empty fields used to come out of req.sanitize() as undefined and end up as
// the literal text "undefined" in the file name. Keep that so existing names do not change.
const MISSING = 'undefined'

// Reduces a request value to one safe file-name component.
function safeComponent (value, maxLen = COMPONENT_MAX) {
  if (typeof value === 'number' && Number.isFinite(value)) value = String(value)
  if (typeof value !== 'string' || value === '') return MISSING
  const s = value
    .replace(/[^A-Za-z0-9_.-]/g, '_') // separators, NUL, whitespace, unicode, HTML...
    .replace(/\.{2,}/g, '_') // no ".." anywhere
    .replace(/^\.+/, '') // no leading dot
    .slice(0, maxLen)
  return s || MISSING
}

// Returns the absolute study directory, or null if `study` is not the name of an
// existing directory directly under dataRoot.
function resolveStudyDir (dataRoot, study) {
  if (!dataRoot || typeof study !== 'string' || !STUDY_RE.test(study) || study.includes('..')) return null
  const root = path.resolve(dataRoot)
  const dir = path.resolve(root, study)
  if (path.dirname(dir) !== root || path.basename(dir) !== study) return null
  try {
    return fs.statSync(dir).isDirectory() ? dir : null
  } catch (err) {
    return null
  }
}

function isDirectory (dir) {
  try {
    return fs.statSync(dir).isDirectory()
  } catch (err) {
    return false
  }
}

// Joins dir and name, and throws unless the result is a direct child of dir.
function targetInside (dir, name) {
  const file = path.resolve(dir, name)
  if (path.dirname(file) !== dir || path.basename(file) !== name) {
    throw new Error(`refusing to write outside ${dir}`)
  }
  return file
}

function randomSuffix () {
  return crypto.randomBytes(4).toString('hex')
}

function saveToken (value) {
  return typeof value === 'string' && TOKEN_RE.test(value) ? value : null
}

function toCsv (data) {
  return new Promise((resolve, reject) => {
    jsonexport(data, (err, csv) => (err ? reject(err) : resolve(csv)))
  })
}

function createResultWriter () {
  // `${dir}\0${name}\0${sha256(token)}` -> { file, queue, expires }
  const runs = new Map()

  function prune (now) {
    for (const [key, run] of runs) if (run.expires < now) runs.delete(key)
  }

  // Creates a new file. Never opens an existing one.
  async function createExclusive (dir, base, ext, content) {
    for (let i = 0; i < CREATE_ATTEMPTS; i++) {
      const name = i === 0 ? base + ext : `${base}_${randomSuffix()}${ext}`
      const file = targetInside(dir, name)
      try {
        await fs.promises.writeFile(file, content, { flag: 'wx' })
        return file
      } catch (err) {
        if (err.code !== 'EEXIST') throw err
      }
    }
    throw new Error(`no free file name for ${base}${ext} in ${dir}`)
  }

  // Legacy /save behaviour: write (and truncate) the named file. The directory and name
  // are still confined, so only result files inside a study directory can be replaced.
  async function overwrite (dir, base, ext, content) {
    const file = targetInside(dir, base + ext)
    await fs.promises.writeFile(file, content)
    return file
  }

  // First write for (dir, name, token) creates a new file; later writes with the same
  // token update that file only. Writes for one run are applied in arrival order.
  function owned (dir, base, ext, content, token) {
    if (!token) return createExclusive(dir, base, ext, content)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const key = [dir, base + ext, tokenHash].join('\0')
    const now = Date.now()
    let run = runs.get(key)
    if (!run || run.expires < now) {
      if (runs.size >= MAX_TRACKED_RUNS) prune(now)
      if (runs.size >= MAX_TRACKED_RUNS) return createExclusive(dir, base, ext, content)
      run = { file: null, queue: Promise.resolve() }
      runs.set(key, run)
    }
    run.expires = now + RUN_TTL_MS
    const result = run.queue.then(async () => {
      if (run.file === null) {
        run.file = await createExclusive(dir, base, ext, content)
      } else {
        await fs.promises.writeFile(targetInside(dir, path.basename(run.file)), content)
      }
      return run.file
    })
    run.queue = result.catch(() => {})
    return result
  }

  return { createExclusive, overwrite, owned }
}

function registerDataSaveRoutes (app, options = {}) {
  const dataRoot = options.dataRoot || process.env.DATA_PATH || null
  const fallbackDir = path.resolve(options.fallbackDir || path.join('data', 'free'))
  const writer = createResultWriter()

  // Tries the study directory, then the fallback directory.
  async function save ({ study, base, ext, content, mode, token }) {
    const dirs = []
    const studyDir = resolveStudyDir(dataRoot, study)
    if (studyDir) dirs.push(studyDir)
    if (isDirectory(fallbackDir)) dirs.push(fallbackDir)
    if (dirs.length === 0) throw new Error('no study or fallback directory available')

    let lastErr
    for (const dir of dirs) {
      try {
        if (mode === 'overwrite') return await writer.overwrite(dir, base, ext, content)
        if (mode === 'owned') return await writer.owned(dir, base, ext, content, token)
        return await writer.createExclusive(dir, base, ext, content)
      } catch (err) {
        lastErr = err
        logger.error(err, `could not save ${base}${ext} in ${dir}`)
      }
    }
    throw lastErr
  }

  function expInfoOf (req) {
    const info = req.body && req.body.expInfo
    return info && typeof info === 'object' && !Array.isArray(info) ? info : null
  }

  function isTrialsData (data) {
    return data !== null && typeof data === 'object'
  }

  app.post('/save', async (req, res) => {
    const info = expInfoOf(req)
    if (!info || !isTrialsData(req.body.trials_data)) return res.status(400).send('invalid data')
    try {
      const csv = await toCsv(req.body.trials_data)
      const base = [info.task, info.participant, info.session, info.date].map((v) => safeComponent(v)).join('_')
      const file = await save({ study: info.study, base, ext: '.csv', content: csv, mode: 'overwrite' })
      logger.info(`${file} saved`)
      res.status(200).send('data saved')
    } catch (err) {
      logger.error(err, '/save failed')
      res.status(500).send('could not save')
    }
  })

  app.post('/savecoop', async (req, res) => {
    const info = expInfoOf(req)
    if (!info || !isTrialsData(req.body.trials_data)) return res.status(400).send('invalid data')
    try {
      const csv = await toCsv(req.body.trials_data)
      const runId = typeof info.run_id === 'string' ? info.run_id.split('.')[0] : info.run_id
      const base = [info.task, info.participant, info.session, runId, info.date].map((v) => safeComponent(v)).join('_')
      const file = await save({
        study: info.study,
        base,
        ext: '.csv',
        content: csv,
        mode: 'owned',
        token: saveToken(req.body.save_token)
      })
      logger.info(`${file} saved`)
      res.status(200).send('data saved')
    } catch (err) {
      logger.error(err, '/savecoop failed')
      res.status(500).send('could not save')
    }
  })

  app.post('/saveAudio', async (req, res) => {
    const info = expInfoOf(req)
    const base64 = req.body && req.body.base64data
    if (!info || typeof base64 !== 'string') return res.status(400).send('invalid data')
    try {
      const audio = Buffer.from(base64.replace(/^data:audio\/\w+;base64,/, ''), 'base64')
      const c = (v) => safeComponent(v)
      const base = `${c(info.task)}_${c(info.participant)}_B${c(info.block)}_${c(info.session)}_${c(info.date)}`
      const file = await save({ study: info.study, base, ext: '.wav', content: audio, mode: 'exclusive' })
      logger.info(`${file} saved`)
      res.send('audio saved')
    } catch (err) {
      logger.error(err, '/saveAudio failed')
      res.status(500).send('could not save')
    }
  })
}

module.exports = {
  registerDataSaveRoutes,
  createResultWriter,
  safeComponent,
  resolveStudyDir,
  COMPONENT_MAX
}
