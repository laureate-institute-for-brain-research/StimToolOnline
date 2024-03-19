/* eslint-disable n/handle-callback-err */
// API realted function
const fs = require('fs')
// const url = require('url')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const jsonexport = require('jsonexport')
const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

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
     */
  app.post('/adduser', (req, res) => {
    // console.log(req.body)

    models.dashboard.findOne({
      where: req.body
    })
      .then((result) => {
        // console.log(result)
        if (result == null) {
          req.body.link = uuidv4() // Create unique uuid for this user/stud/session

          models.dashboard.create({
            subject: req.sanitize(req.body.subject),
            study: req.sanitize(req.body.study),
            session: req.sanitize(req.body.session),
            link: req.sanitize(req.body.link)
          })
            .then(() => {
              res.send({
                message: 'ok',
                info: req.body
              })
            })
        } else {
          // already have same subject, study, session
          // console.log(result)
          res.send({
            message: 'subject/study/session already exists in database',
            info: result
          })
        }
      })
  })

  // use this for verifcation
  // Sends them to appropirate link
  app.get('/link', (req, res) => {
    let id = req.sanitize(req.query.id)

    if (req.body.id) {
      id = req.body.id
    }

    // Change where to route them based on id
    if (id.charAt(0) === 'U') {
      res.redirect('/js/tasks/driving/completed.html')
    }

    models.dashboard.findOne({
      where: {
        link: id
      }
    })
      .then(function (link) {
        if (link == null) {
          res.redirect('/')
          logger.info('homepage redirect')
        } else {
          // res.send(link)
          let index = 0
          // If index  paramater is set, than use that, if not, default is 0
          if (req.query.index) { index = parseInt(req.query.index) }
          const jsonLink = './public/study/' + link.study + '_' + link.session + '.json'
          logger.info('redirect jsonlink')
          logger.info(`${jsonLink}`)
          // console.log('study json: ', jsonLink)
          const sessionFile = require(jsonLink)
          logger.info('redirect linklink')
          logger.info(`${link.link}`)
          res.redirect(sessionFile.order[index] + '&id=' + link.link)
        }
      },
      function (err) {
        res.redirect('/')
      }
      )
      .catch(error => {
        logger.error(error)
        res.redirect('/')
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

  // send save info given link
  app.post('/save', (req, res) => {
    const trialsData = req.body.trials_data

    // console.log(trials_data)
    req.body.expInfo.date = req.body.expInfo.date.split('/').join('_')
    // Save to /data/folder based of study
    jsonexport(trialsData, function (err, csv) {
      if (err) return logger.error(err)

      // File name is by taskname, participant id, session and date
      const fileName = req.sanitize(req.body.expInfo.task) + '_' + req.sanitize(req.body.expInfo.participant) + '_' + req.sanitize(req.body.expInfo.session) + '_' + req.sanitize(req.body.expInfo.date) + '.csv'

      // fileName = fileName.replaceAll("/", "_")

      let pathToSave = `${process.env.DATA_PATH}/${req.sanitize(req.body.expInfo.study)}/${fileName}` // save results directly the cephfs local path

      // logger.info(`trying to save to ${pathToSave}`);

      fs.access(path.dirname(pathToSave), error => {
        if (!error) {
          // The check succeeded
          fs.writeFile(pathToSave, csv, function (err) {
            if (err) return logger.error(`${Date.now()} ` + `${pathToSave}: ` + err)
            logger.info(Date.now())
            logger.info(`${pathToSave} saved`)
            logger.info(trialsData[Object.keys(trialsData)[trialsData.length - 1]])
          })
        } else {
          // The check failed
          // meaning subject probably entered their own  study -_- or field is blank
          // Save to local
          pathToSave = `data/free/${fileName}`

          fs.writeFile(pathToSave, csv, function (err) {
            if (err) return logger.error(`${Date.now()} ` + `${pathToSave}: ` + err)
            logger.info(`${pathToSave} saved`)
          })
        }
      })
    })
    res.status(200).send('data saved')
  })

  // send save info given link
  app.post('/savecoop', (req, res) => {
    const trialsData = req.body.trials_data

    // console.log(trials_data)
    req.body.expInfo.date = req.body.expInfo.date.split('/').join('_')
    // File name is by taskname, participant id, session and date
    let fileName = req.sanitize(req.body.expInfo.task) + '_' + req.sanitize(req.body.expInfo.participant) + '_' + req.sanitize(req.body.expInfo.session) + '_' + req.sanitize(req.body.expInfo.run_id.split('.')[0]) + '_' + req.sanitize(req.body.expInfo.date) + '.csv'

    // fileName = fileName.replaceAll("/", "_")
    let pathToSave = `${process.env.DATA_PATH}/${req.sanitize(req.body.expInfo.study)}/${fileName}` // save results directly the cephfs local path

    // Save to /data/folder based of study
    jsonexport(trialsData, function (err, csv) {
      if (err) return logger.error(`${Date.now()} ` + `${pathToSave}: ` + err)

      // File name is by taskname, participant id, session and date
      fileName = req.sanitize(req.body.expInfo.task) + '_' + req.sanitize(req.body.expInfo.participant) + '_' + req.sanitize(req.body.expInfo.session) + '_' + req.sanitize(req.body.expInfo.run_id.split('.')[0]) + '_' + req.sanitize(req.body.expInfo.date) + '.csv'

      // fileName = fileName.replaceAll("/", "_")

      pathToSave = `${process.env.DATA_PATH}/${req.sanitize(req.body.expInfo.study)}/${fileName}` // save results directly the cephfs local path

      // logger.info(`trying to save to ${pathToSave}`);

      fs.access(path.dirname(pathToSave), error => {
        if (!error) {
          // The check succeeded
          fs.writeFile(pathToSave, csv, function (err) {
            if (err) return logger.error(`${Date.now()} ` + `${pathToSave}: ` + err)
            logger.info(`${pathToSave} saved`)
          })
        } else {
          // The check failed
          // meaning subject probably entered their own  study -_- or field is blank
          // Save to local
          pathToSave = `data/free/${fileName}`

          fs.writeFile(pathToSave, csv, function (err) {
            if (err) return logger.error(`${Date.now()} ` + `${pathToSave}: ` + err)
            logger.info(`${pathToSave} saved`)
          })
        }
      })
    })
    res.status(200).send('data saved')
  })

  app.post('/SaveHitCSV', (req, res) => {
    const csvpath = req.body.csvpath
    const content = req.body.content

    fs.appendFile(csvpath, content, (err) => {
      console.log(err)
    })

    res.status(200).send('data saved')
  })

  app.post('/logStuff', (req, res) => {
    const csvpath = req.body.csvpath
    const content = req.body.content

    fs.appendFile(csvpath, content, (err) => {
      console.log(err)
    })

    res.status(200).send('data saved')
  })

  app.post('/SaveDevInfo', (req, res) => {
    const csvpath = req.body.csvpath
    const content = `user: ${req.body.username} ::: ${req.body.dimensions} ::: ${req.body.content}`

    fs.appendFile(csvpath, content, (err) => {
      console.log(err)
    })

    res.status(200).send('dev data saved')
  })

  // save Audio
  app.post('/saveAudio', (req, res) => {
    // const q = url.URL(req.url, true).query
    logger.info('saving Audio Post requested')
    // console.log(req.body)
    const base64 = req.body.base64data

    const data = base64.replace(/^data:audio\/\w+;base64,/, '')
    // var buffer = new Buffer(req.body.audio, 'base64'); // decode

    // const savePath = 'data/cognitive_control/audio/' + q.task + '/'

    // filename = savePath + q.task + '-' + q.subject + '-' + 'B' + q.block + '-' + 'T' + q.session + '.wav'
    let fileName = req.sanitize(req.body.expInfo.task) + '_' + req.sanitize(req.body.expInfo.participant) +
            '_B' + req.sanitize(req.body.expInfo.block) + '_' + req.sanitize(req.body.expInfo.session) +
            '_' + req.sanitize(req.body.expInfo.date) + '.wav'

    fileName = fileName.replace_all('/', '_')

    let pathToSave = `${process.env.DATA_PATH}/${req.sanitize(req.body.expInfo.study)}/${fileName}` // save results directly the cephfs local path
    fs.access(path.dirname(pathToSave), error => {
      if (!error) {
        // The check succeeded
        fs.writeFile(pathToSave, data, { encoding: 'base64' }, function (err) {
          if (err) {
            logger.error('err', err)
          }
        })
      } else {
        // The check failed
        // meaning subject probably entered their own  study -_- or field is blank

        pathToSave = `data/free/${fileName}`
        fs.writeFile(pathToSave, data, { encoding: 'base64' }, function (err) {
          if (err) {
            logger.error('err', err)
          }
        })
      }
    })
    res.send('audio saved')
  })

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

  app.post('/mturklink', (req, res) => {
    logger.info('/mturklink called')
    models.dashboard.findOne({
      where: {
        subject: req.sanitize(req.body.subject),
        study: req.sanitize(req.body.study),
        session: req.sanitize(req.body.session)
      }
    })
      .then((result) => {
        // console.log(result)
        if (result == null) {
          logger.info('creating account')
          req.body.link = uuidv4() // Create unique uuid for this user/stud/session

          models.dashboard.create({
            subject: req.sanitize(req.body.subject),
            study: req.sanitize(req.body.study),
            session: req.sanitize(req.body.session),
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
