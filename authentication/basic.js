// HTTP Basic auth for staff-only routes (/dashboard, /getSubjectInfo, /data listing,
// /resetCanonMemories). Credentials come from DASHBOARD_USER / DASHBOARD_PASSWORD; if either is
// unset every request is refused.
const auth = require('basic-auth')
const crypto = require('crypto')

// Constant-time string comparison (hash first so lengths always match)
function same (a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

module.exports = function (request, response, next) {
  const name = process.env.DASHBOARD_USER
  const password = process.env.DASHBOARD_PASSWORD
  const user = auth(request)
  const nameOk = Boolean(user && name && same(user.name, name))
  const passOk = Boolean(user && password && same(user.pass, password))
  if (!nameOk || !passOk) {
    response.set('WWW-Authenticate', 'Basic realm="db"')
    return response.status(401).send()
  }
  return next()
}
