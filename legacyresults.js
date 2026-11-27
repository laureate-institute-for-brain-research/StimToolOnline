// Limits for the legacy result routes in api.js (wave1/wave2/wave3/mindreal/cognitive_control):
// the save routes that write CSV files under data/, and the score routes that read them back.
//
// Anyone can call these routes without logging in, so neither side trusts the request:
//   - a save writes only when the study already has its data directory, every name in the file
//     path is a single safe path component, and the content is no bigger than a real export;
//   - the request body for these routes is capped well below the global 100 MB limit;
//   - a score read checks the file size before reading, never reads more than MAX_FILE_BYTES,
//     and splits at most MAX_ROWS lines into at most MAX_CELLS cells each. So one request costs
//     a fixed amount of time and memory however large the file on disk is.
//
// A real chicken task export is about 1,500 rows of ~120 bytes (~200 KB); surveys are a few KB.

const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
const { isSafeName } = require('./pages')

const MAX_CONTENT_BYTES = 1024 * 1024 // task data in one save request
const MAX_FILE_BYTES = 2 * 1024 * 1024 // a result file: content + header rows, with headroom
const MAX_BODY = '2mb' // request body for the legacy save routes (JSON-escaped content)
const MAX_ROWS = 10000
const MAX_CELLS = 32 // the score helpers read columns 0-11 only

// Every legacy route that writes a result file (Express matching: case-insensitive, any suffix)
const SAVE_PATHS = [
  '/saveSurvey', '/saveDPTask', '/saveDC', '/saveSquareCircleRating', '/saveChickenTask',
  '/saveGoNoGo', '/saveFlanker', '/saveColorStroop', '/saveEmotionalStroop'
]

// Thrown for a request the server refuses; pages.handleRouteError turns `status` into the response
class LegacyInputError extends Error {
  constructor (status, message) {
    super(message)
    this.status = status
    this.expose = true
  }
}

const tooLarge = (what) => new LegacyInputError(413, `${what} too large`)

// Body parsers with a small limit, mounted on SAVE_PATHS before the global parsers.
// body-parser skips a request whose body is already parsed, so the global 100 MB parsers never
// see these routes; an oversized body is refused with 413 before it is buffered.
function saveBodyParsers () {
  return [
    bodyParser.urlencoded({ extended: true, parameterLimit: 10000, limit: MAX_BODY }),
    bodyParser.json({ limit: MAX_BODY })
  ]
}

// Each value must be one plain path component (see pages.isSafeName)
function requireSafeIds (ids) {
  for (const [field, value] of Object.entries(ids)) {
    if (!isSafeName(value)) throw new LegacyInputError(400, `invalid ${field}`)
  }
}

// data/<study>/<sub> must already exist: study directories are set up by staff, never by a request
function requireKnownStudy (study, sub, dataRoot = 'data') {
  requireSafeIds({ study })
  let known = false
  try {
    known = fs.statSync(path.join(dataRoot, study, sub)).isDirectory()
  } catch (err) {
    known = false
  }
  if (!known) throw new LegacyInputError(404, 'unknown study')
}

function requireContent (content) {
  if (typeof content !== 'string') throw new LegacyInputError(400, 'missing content')
  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) throw tooLarge('content')
  return content
}

// An existing file that is already at the limit is not appended to
function requireRoomToAppend (file) {
  let size = 0
  try {
    size = fs.statSync(file).size
  } catch (err) {
    return
  }
  if (size >= MAX_FILE_BYTES) throw tooLarge('result file')
}

// Reads a result CSV as rows of cells, with the same shape the old toArrayfromCSVString gave
// (split on '\n', then on ','), but bounded: throws a 413 LegacyInputError for a file over
// MAX_FILE_BYTES or MAX_ROWS lines, and keeps at most MAX_CELLS cells per row.
// Other errors (ENOENT...) are thrown as they are.
function readCsvRows (file) {
  const fd = fs.openSync(file, 'r')
  try {
    const stat = fs.fstatSync(fd)
    if (!stat.isFile()) throw new LegacyInputError(400, 'not a result file')
    if (stat.size > MAX_FILE_BYTES) throw tooLarge('result file')
    // One spare byte: a file that grew past the limit after fstat is caught below
    const buf = Buffer.alloc(stat.size + 1)
    let n = 0
    while (n < buf.length) {
      const read = fs.readSync(fd, buf, n, buf.length - n, n)
      if (read === 0) break
      n += read
    }
    if (n > MAX_FILE_BYTES) throw tooLarge('result file')
    const lines = buf.toString('utf8', 0, n).split('\n', MAX_ROWS + 1)
    if (lines.length > MAX_ROWS) throw tooLarge('result file')
    return lines.map((line) => line.split(',', MAX_CELLS))
  } finally {
    fs.closeSync(fd)
  }
}

module.exports = {
  LegacyInputError,
  SAVE_PATHS,
  saveBodyParsers,
  requireSafeIds,
  requireKnownStudy,
  requireContent,
  requireRoomToAppend,
  readCsvRows,
  MAX_CONTENT_BYTES,
  MAX_FILE_BYTES,
  MAX_ROWS,
  MAX_CELLS,
  MAX_BODY
}
