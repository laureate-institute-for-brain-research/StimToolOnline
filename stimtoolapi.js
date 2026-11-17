/* eslint-disable n/handle-callback-err */
// API realted function
// const url = require('url')
const { v4: uuidv4 } = require('uuid')
const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })
const keys = require('./keys')
const { registerHitLogRoutes } = require('./hitlog')
const { registerDataSaveRoutes } = require('./datasave')
const { studyExists, loadStudy, isLocalPath } = require('./studyfiles')

// const accountSid = process.env.TWILIO_ACCOUNT_SID
// const authToken = process.env.TWILIO_AUTH_TOKEN

// const client = require('twilio')(accountSid, authToken);

// const formData = require('form-data')
// const Mailgun = require('mailgun.js');
// const mailgun = new Mailgun(formData);

// const mg = mailgun.client({
//     username: 'api',
//     key: process.env.MAILGUN_API_KEY,
//     public_key: process.env.MAILGUN_PUBLIC_KEY
// });

// var mailgun = require('mailgun-js')({ apiKey: mailgun_api_key, domain: mailgun_domain });

const models = require('./models')

module.exports = function (app) {
  // ROUTES

  /**
     * Adds user to database
     * Returns json object with message and subject info json object
     *
     * `study` and `session` must name an existing public/study/<study>_<session>.json
     * (see studyfiles.js). Anything else, including values with path separators or dot
     * segments, is rejected with 400 and no row is created.
     */
  app.post('/adduser', async (req, res) => {
    const { study, session } = req.body
    if (!(await studyExists(study, session))) {
      return res.status(400).send({ message: 'invalid study or session' })
    }
    const subject = typeof req.body.subject === 'string' ? req.sanitize(req.body.subject) : ''
    if (!subject) {
      return res.status(400).send({ message: 'invalid subject' })
    }

    models.dashboard.findOne({
      where: { subject, study, session }
    })
      .then((result) => {
        if (result == null) {
          const link = uuidv4() // Create unique uuid for this user/stud/session
          return models.dashboard.create({ subject, study, session, link })
            .then(() => {
              res.send({
                message: 'ok',
                info: { subject, study, session, link }
              })
            })
        }
        // already have same subject, study, session
        res.send({
          message: 'subject/study/session already exists in database',
          info: result
        })
      })
      .catch((error) => {
        logger.error(error)
        res.status(500).send({ message: 'error adding user' })
      })
  })

  // use this for verifcation
  // Sends them to appropirate link
  app.get('/link', (req, res) => {
    let id = req.sanitize(req.query.id)

    if (req.body.id) {
      id = req.body.id
    }

    if (typeof id !== 'string' || id === '') {
      return res.redirect('/')
    }

    // Change where to route them based on id
    if (id.charAt(0) === 'U') {
      return res.redirect('/js/tasks/driving/completed.html')
    }

    models.dashboard.findOne({
      where: {
        link: id
      }
    })
      .then(async function (link) {
        if (link == null) {
          logger.info('homepage redirect')
          return res.redirect('/')
        }

        // The study definition is read as JSON data from public/study/ only; study and
        // session must be plain names (see studyfiles.js). Never require() this path.
        const sessionFile = await loadStudy(link.study, link.session)
        const order = sessionFile && Array.isArray(sessionFile.order) ? sessionFile.order : null
        if (order === null) {
          logger.warn({ study: link.study, session: link.session }, '/link: no valid study definition for row')
          return res.redirect('/')
        }

        // If index paramater is set, then use that, if not, default is 0
        let index = 0
        if (req.query.index) {
          if (typeof req.query.index !== 'string' || !/^\d{1,4}$/.test(req.query.index)) {
            return res.redirect('/')
          }
          index = parseInt(req.query.index, 10)
        }

        const step = index < order.length ? order[index] : undefined
        const target = isLocalPath(step) ? step + '&id=' + encodeURIComponent(link.link) : null
        if (target === null || !isLocalPath(target)) {
          logger.warn({ study: link.study, session: link.session, index }, '/link: order entry is not a local path')
          return res.redirect('/')
        }
        logger.info('redirect linklink')
        logger.info(`${link.link}`)
        res.redirect(target)
      })
      .catch(error => {
        logger.error(error)
        if (!res.headersSent) res.redirect('/')
      })
  })

  // send dashboard info given link
  app.post('/getInfo', (req, res) => {
    const id = req.sanitize(req.body.id)

    models.dashboard.findOne({
      where: {
        link: id
      }
    })
      .then(
        function (result) {
          if (result == null) {
            res.send({})
          } else {
            res.send(result)
          }
        }
      )
      .catch(error => {
        res.send({})
      })
  })

  // Keys that the browser needs (e.g. FullCalendar's Google Calendar source in the TLFB surveys).
  // Only add keys here that are safe to expose to participants.
  app.get('/clientKeys', (req, res) => {
    res.send({
      googleCalendarApiKey: keys.google.calendar_api_key
    })
  })

  // send dashboard info given link
  app.post('/getSubjectInfo', (req, res) => {
    const subject = req.sanitize(req.body.subject)

    models.dashboard.findAll({
      where: {
        subject
      }
    })
      .then(
        function (result) {
          if (result == null) {
            res.send({})
          } else {
            res.send(result)
          }
        }
      )
      .catch(error => {
        res.send({})
      })
  })

  // POST /save, /savecoop, /saveAudio: write result files under DATA_PATH/<study> or data/free
  registerDataSaveRoutes(app)

  // POST /SaveHitCSV, /logStuff, /SaveDevInfo: append to fixed files in HIT_LOG_DIR
  registerHitLogRoutes(app)

  // send save info given link
  app.post('/share', (req, res) => {
    // console.log(req.body)
    const id = req.sanitize(req.body.id)

    models.dashboard.findOne({
      where: {
        link: id
      }
    })
      .then(
        function (result) {
          if (result == null) {
            res.send({ message: 'not valid id' })
          } else {
            const ulink = 'https://tasks.laureateinstitute.org/link?id=' + id
            const data = {
              from: req.sanitize(req.body.from),
              to: req.sanitize(req.body.to),
              subject: 'Shared Link',
              text: `Hello!\n\nA link has been shared to you. Click the link to perform the task: ${ulink}\n\nThank you for your participation.`,
              html: sharedLinkHTMLTemplate(ulink, req.sanitize(req.body.body))
            }

            logger.info('Sending email: ' + req.body.to)
            // logger.info(data)
            const mg = ''

            mg.messages.create(process.env.MAILGUN_DOMAIN, data)
              .then(msg => console.log(msg)) // logs response data

            // test
            // res.send({'message': 'email sent!'})
          }
        }
      )
      .catch(error => {
        logger.info(error)
        res.send({ message: 'error sending email' })
      })
  })

  app.post('/mturklink', async (req, res) => {
    logger.info('/mturklink called')
    // Same rule as /adduser: only names of an existing study definition are stored
    const { study, session } = req.body
    if (!(await studyExists(study, session))) {
      return res.status(400).send('invalid study or session')
    }
    models.dashboard.findOne({
      where: {
        subject: req.sanitize(req.body.subject),
        study,
        session
      }
    })
      .then((result) => {
        // console.log(result)
        if (result == null) {
          logger.info('creating account')
          req.body.link = uuidv4() // Create unique uuid for this user/stud/session

          return models.dashboard.create({
            subject: req.sanitize(req.body.subject),
            study,
            session,
            email: req.sanitize(req.body.email),
            phone: req.sanitize(req.body.phone),
            link: req.sanitize(req.body.link)
          })
            .then((result) => {
              // Added to table
              // Send them Link
              result.email = req.sanitize(req.body.email)
              result.phone = req.sanitize(req.body.phone)
              result.link_type = req.sanitize(req.body.link_type)
              sendLink(result)
            })
        } else {
          logger.info('already have account')
          // already have same subject, study, session
          // Still send them the link
          // console.error(result)
          result.email = req.sanitize(req.body.email)
          result.phone = req.sanitize(req.body.phone)
          result.link_type = req.sanitize(req.body.link_type)
          sendLink(result)
          // res.send({
          //     'message': 'subject/study/session already exists in database',
          //     'info': result
          // })
        }
      })
      .catch((error) => logger.error(error))

    res.redirect(301, '/mturk/driving?submitform=completed')
  })

  function sendLink (result) {
    if (result.link_type === 'text') {
      // const ulink = 'https://tasks.laureateinstitute.org/link?id=' + result.link
      // let body = 'Thank You for your participation. Here is your link to the survey: ' + ulink

      // console.log(body)
      logger.info('text message sent to ' + result.phone)
      // client.messages
      //     .create({
      //         body: body,
      //         from: '+19189927728',
      //         to: result.phone
      //     })
      //     .then(message => logger.info(message.sid));
    }
    if (result.link_type === 'email') {
      const ulink = 'https://tasks.laureateinstitute.org/link?id=' + result.link
      const data = {
        from: 'no-reply@paulus.touthang.info',
        to: result.email,
        subject: 'Shared Link',
        text: `Hello!\n\nA link has been shared to you. Click the link to perform the task: ${ulink}\n\nThank you for your participation.`,
        html: sharedLinkHTMLTemplate(ulink, '')
      }

      // new way to send with mailgun.s
      const mg = ''
      mg.messages.create(process.env.MAILGUN_DOMAIN, data)
        .then(msg => console.log(msg)) // logs response data
    }
  }

  function sharedLinkHTMLTemplate (link, body) {
    if (body === undefined) {
      body = ''
    }
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Shared Link | StimTool Online</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin: 0; padding: 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="padding: 10px 0 30px 0;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border: 1px solid #cccccc; border-collapse: collapse;">
                            <tr>
                                <td align="center" bgcolor="#FFFFFF" style="padding: 40px 0 30px 0; color: #153643; font-size: 28px; font-weight: bold; font-family: Arial, sans-serif;">
                                <center><a href="http://www.laureateinstitute.org/"><img class="logo" style = "width: 400px;
                                height: 70px;" src="https://tasks.laureateinstitute.org/images/logo.png"></a></center>
                                </td>

                            </tr>
                            <tr>
                                <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td style="color: #153643; font-family: Arial, sans-serif; font-size: 24px;">
                                                <center><b>Shared Link | StimTool Online</b></center>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                                                Hello!
                                                <br>
                                                A session link has been shared to you! 
                                                <br>Click the link below to proceed to the tasks.
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 50px; line-height: 20px;">
                                                <center><a href="${link}" style="display: inline-block; border: none; padding: 1rem 2rem;margin: 0; text-decoration: none;background: #0069ed;
                                                    color: #ffffff; font-family: sans-serif;font-size: 1rem; cursor: pointer; text-align: center; transition: background 250ms ease-in-out, 
                                                    transform 150ms ease; -webkit-appearance: none; -moz-appearance: none;">Go To Session</a href="${link}"></center>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                                                ${body}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                                                If the above button doesn't work, copy and paste the link below:
                                                <br>
                                                ${link}
                                                <br>
                                                <p>Please do not reply to this email. If you have questions, email us at jtouthang@libr.net</p>
                                            </td>
                                        </tr>

                                    </table>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
            
        </body>
    </html>`
  }
}
