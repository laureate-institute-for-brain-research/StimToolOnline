// Serving fixed HTML pages (and the task/survey index pages) so that a failed read becomes an
// HTTP error for that one request instead of an exception that takes down the whole process.
//
// Every fs callback here catches its own errors and hands them to Express via next(err), so
// nothing can throw outside Express's error handling.

const fs = require('fs')
const path = require('path')
const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

// Read errors that mean "there is no such page" (as opposed to a server fault)
const MISSING = new Set(['ENOENT', 'ENOTDIR', 'EISDIR', 'ENAMETOOLONG'])

// A single path component: no separators, no leading dot (so no '.', '..' or hidden entries)
const NAME_RE = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,127}$/

function isSafeName (name) {
  return typeof name === 'string' && NAME_RE.test(name)
}

function notFound (res) {
  if (!res.headersSent) res.status(404).type('text/plain').send('Not found')
}

// Responds 200 with the HTML file, 404 if it does not exist, or passes other read errors
// (permissions, I/O) to Express error handling.
function sendHtmlFile (res, next, file) {
  fs.readFile(file, (err, data) => {
    try {
      if (err) {
        if (MISSING.has(err.code)) {
          logger.warn(`page not found: ${path.basename(file)} (${err.code})`)
          return notFound(res)
        }
        return next(err)
      }
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(data)
    } catch (e) {
      next(e)
    }
  })
}

// Serves <baseDir>/<name>/<file>, but only when <name> is a safe component that matches an
// existing entry directly inside baseDir. The request-derived name never reaches a path
// until it has been matched against the directory listing.
function sendPageInDir (res, next, baseDir, name, file) {
  if (!isSafeName(name)) return notFound(res)
  fs.readdir(baseDir, { withFileTypes: true }, (err, entries) => {
    try {
      if (err) return MISSING.has(err.code) ? notFound(res) : next(err)
      const found = entries.some((e) => e.name === name && (e.isDirectory() || e.isSymbolicLink()))
      if (!found) return notFound(res)
      sendHtmlFile(res, next, path.join(baseDir, name, file))
    } catch (e) {
      next(e)
    }
  })
}

// Last Express middleware: one failed request gets a 500, the server keeps running.
// eslint-disable-next-line no-unused-vars
function handleRouteError (err, req, res, next) {
  logger.error(err, `request failed: ${req.method} ${req.path}`)
  if (res.headersSent) return next(err) // Express closes the half-sent response
  res.status(500).type('text/plain').send('Internal Server Error')
}

module.exports = { isSafeName, sendHtmlFile, sendPageInDir, handleRouteError, NAME_RE }
