// Central access point for API keys and credentials that used to be hard-coded in the source.
//
// Values are read from keys.json in the repo root (not committed; see keys.example.json).
// Set KEYS_PATH to load the file from another location.
// Deployment settings and server credentials (MySQL, dashboard, IAPS, Mailgun, Twilio) stay in .env.

const fs = require('fs')
const path = require('path')
const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

const keysPath = process.env.KEYS_PATH || path.join(__dirname, 'keys.json')

let file = {}
if (fs.existsSync(keysPath)) {
  file = JSON.parse(fs.readFileSync(keysPath, 'utf8'))
} else {
  logger.warn(`keys file not found at ${keysPath}`)
}

const cloudinary = file.cloudinary || {}
const google = file.google || {}
const legacy = file.legacy || {}

module.exports = {
  cloudinary: {
    name: cloudinary.name,
    api_key: cloudinary.api_key,
    api_secret: cloudinary.api_secret
  },
  // Browser-facing key: sent to participants via GET /clientKeys, so restrict it by HTTP referrer in Google Cloud
  google: {
    calendar_api_key: google.calendar_api_key
  },
  // Credentials used only by the disabled MTurk-era code (study/*, legacy api.js email functions)
  legacy: {
    mysql_user: legacy.mysql_user,
    mysql_password: legacy.mysql_password,
    mailgun_api_key: legacy.mailgun_api_key,
    mailgun_domain: legacy.mailgun_domain
  }
}
