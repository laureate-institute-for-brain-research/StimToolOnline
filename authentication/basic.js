const auth = require('basic-auth')

const admin = { name: 'user', password: 'password' }

module.exports = function (request, response, next) {
  var user = auth(request)
  if (!user || !admin.name || admin.password !== user.pass) {
    response.set('WWW-Authenticate', 'Basic realm="db"')
    return response.status(401).send()
  }
  return next()
}