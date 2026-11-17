// Append-only logs for HIT completion codes, device info and the "skip" button.
//
// The server decides where these go: each route writes to one fixed file name inside
// HIT_LOG_DIR. Nothing in the request influences which file is opened. Any `csvpath`
// field sent by older clients is ignored.
//
// HIT_LOG_DIR must be outside the application directory (so it is never served by
// express.static, and never mixes with code, templates or config). If it is not, the
// routes are disabled and return 503.

const fs = require('fs')
const path = require('path')
const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

const APP_ROOT = path.resolve(__dirname)
const DEFAULT_LOG_DIR = '/media/stimtool_online/HIT_CODES/'

// Fixed set of log files. Keys are internal identifiers, never taken from the request.
const LOG_FILES = Object.freeze({
  hitCodes: 'hit_codes.csv',
  deviceInfo: 'device_info.csv',
  customLog: 'custom_log.csv'
})

const MAX_FIELD_LENGTH = 512
const ENTRY_DELIMITER = ','
// CR, LF and the Unicode line/paragraph separators (U+2028, U+2029)
const LINE_BREAKS = new RegExp('[\\r\\n' + String.fromCharCode(0x2028, 0x2029) + ']+', 'g')

function isInside (child, parent) {
  const rel = path.relative(parent, child)
  return rel === '' || (rel.split(path.sep)[0] !== '..' && !path.isAbsolute(rel))
}

// Returns the absolute log directory, or null if it is unusable.
function resolveLogDir (configured) {
  const dir = path.resolve(configured || DEFAULT_LOG_DIR)
  if (isInside(dir, APP_ROOT)) {
    logger.error(`HIT_LOG_DIR (${dir}) is inside the application directory; HIT logging is disabled`)
    return null
  }
  return dir
}

// Turns a request value into a single, bounded, delimiter-free log field.
// Returns null when the value is not a string (arrays, objects, numbers from JSON bodies).
function sanitizeField (value) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') return null
  return value
    .replace(LINE_BREAKS, ' ') // line breaks would forge new rows
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // other control characters
    .replace(/,/g, ' ') // the delimiter would forge new entries
    .trim()
    .slice(0, MAX_FIELD_LENGTH)
}

function registerHitLogRoutes (app, options = {}) {
  const logDir = resolveLogDir(options.logDir || process.env.HIT_LOG_DIR)

  function append (fileKey, entry, res, okMessage) {
    if (logDir === null) return res.status(503).send('logging unavailable')
    const target = path.join(logDir, LOG_FILES[fileKey])
    fs.appendFile(target, entry + ENTRY_DELIMITER, (err) => {
      if (err) {
        logger.error(err, `failed to append to ${LOG_FILES[fileKey]}`)
        return res.status(500).send('could not save')
      }
      res.status(200).send(okMessage)
    })
  }

  app.post('/SaveHitCSV', (req, res) => {
    const code = sanitizeField(req.body.content)
    if (!code) return res.status(400).send('invalid content')
    append('hitCodes', code, res, 'data saved')
  })

  app.post('/logStuff', (req, res) => {
    const message = sanitizeField(req.body.content)
    if (!message) return res.status(400).send('invalid content')
    append('customLog', message, res, 'data saved')
  })

  app.post('/SaveDevInfo', (req, res) => {
    const username = sanitizeField(req.body.username)
    const dimensions = sanitizeField(req.body.dimensions)
    const content = sanitizeField(req.body.content)
    if (username === null || dimensions === null || content === null) {
      return res.status(400).send('invalid content')
    }
    append('deviceInfo', `user: ${username} ::: ${dimensions} ::: ${content}`, res, 'dev data saved')
  })
}

module.exports = { registerHitLogRoutes, resolveLogDir, sanitizeField, LOG_FILES, MAX_FIELD_LENGTH }
