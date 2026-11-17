// Study definitions live in public/study/<study>_<session>.json.
//
// They are read as data (readFile + JSON.parse) and never loaded with require().
// require() is a code loader. It resolves '..' lexically, and when the exact file is missing
// it retries with .js, .json and .node appended. A name built from request or database values
// could therefore make it run a file from anywhere on disk.
//
// `study` and `session` must match NAME_PATTERN: letters, digits, '_' and '-' only, so a
// value can never hold a path separator, a dot segment or an extension. The resolved file must
// also be a direct child of STUDY_DIR, named exactly `<study>_<session>.json`, and be a
// regular file (not a symlink or directory).

const fs = require('fs')
const path = require('path')

const STUDY_DIR = path.join(__dirname, 'public', 'study')
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/
const MAX_STUDY_FILE_BYTES = 1024 * 1024
const MAX_REDIRECT_LENGTH = 2048
// Characters that are never valid in a redirect target: backslash (browsers treat it as '/'),
// whitespace and control characters (browsers strip tab/CR/LF, so '/\t/evil' becomes '//evil').
// eslint-disable-next-line no-control-regex
const UNSAFE_REDIRECT_CHARS = /[\\\s\x00-\x1f\x7f]/

function isValidName (value) {
  return typeof value === 'string' && NAME_PATTERN.test(value)
}

// Absolute path of the study definition, or null if the names are not allowed.
function studyFilePath (study, session) {
  if (!isValidName(study) || !isValidName(session)) return null
  const fileName = `${study}_${session}.json`
  const resolved = path.resolve(STUDY_DIR, fileName)
  if (path.dirname(resolved) !== STUDY_DIR || path.basename(resolved) !== fileName) return null
  return resolved
}

async function isRegularFile (file) {
  try {
    const stat = await fs.promises.lstat(file)
    return stat.isFile() && stat.size <= MAX_STUDY_FILE_BYTES
  } catch (err) {
    return false
  }
}

// True only if public/study/<study>_<session>.json exists as a regular file.
async function studyExists (study, session) {
  const file = studyFilePath(study, session)
  return file !== null && isRegularFile(file)
}

// Parsed study definition, or null if the names are invalid, the file is missing or the
// contents are not a JSON object.
async function loadStudy (study, session) {
  const file = studyFilePath(study, session)
  if (file === null || !(await isRegularFile(file))) return null
  try {
    const data = JSON.parse(await fs.promises.readFile(file, 'utf8'))
    return data !== null && typeof data === 'object' && !Array.isArray(data) ? data : null
  } catch (err) {
    return null
  }
}

// True if `target` is a path on this site ('/...'), not a scheme, protocol-relative or
// backslash URL that a browser would send somewhere else.
function isLocalPath (target) {
  if (typeof target !== 'string' || target.length === 0 || target.length > MAX_REDIRECT_LENGTH) return false
  if (target[0] !== '/' || target[1] === '/') return false
  if (UNSAFE_REDIRECT_CHARS.test(target)) return false
  try {
    const base = 'http://local.invalid'
    return new URL(target, base).origin === base
  } catch (err) {
    return false
  }
}

module.exports = {
  STUDY_DIR,
  NAME_PATTERN,
  isValidName,
  studyFilePath,
  studyExists,
  loadStudy,
  isLocalPath
}
