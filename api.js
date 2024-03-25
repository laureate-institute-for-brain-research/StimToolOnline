// API realted function
const fs = require('fs')
const url = require('url')

// eslint-disable-next-line no-unused-vars
const models = require('./models')
const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

module.exports = function (app) {
  // ROUTES
  app.get('/', function (req, res) {
    const q = url.parse(req.url, true).query
    // const session = q.session
    // const mkturk_id = q.mkturk_id
    const survey = q.survey
    const task = q.task
    console.log('IN GET REQUEST')
    console.log(q)

    // const study = q.study

    // const ctpattern = q.pattern
    // const type = q.type

    if (task) {
      displayTask(task, req, res, q)
    } else if (survey) {
      console.log('correct')
      console.log(survey)
      displaySurvey(survey, res)
    } else {
      displayHome(res)
    }
  })

  // Returning the get request when it has
  // not been past 25hours
  app.get('/tooearly', function (req, res) {
    // const q = url.parse(req.url, true).query
    // const session = q.session
    // const mkturk_id = q.mkturk_id

    display24HourPage(res)
  })

  app.get('/completed', function (req, res) {
    // const q = url.parse(req.url, true).query
    // const session = q.session
    // const mkturk_id = q.mkturk_id

    displayCompleted(res)
  })

  app.get('/completedHIT', function (req, res) {
    // const q = url.parse(req.url, true).query
    // const session = q.session
    // const mkturk_id = q.mkturk_id

    fs.readFile('completedHIT.html', function (err, data) {
      if (err) {
        console.log('error')
      }
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  })

  app.get('/completeMobile', function (req, res) {
    // const q = url.parse(req.url, true).query
    // const session = q.session
    // const mkturk_id = q.mkturk_id

    fs.readFile('completedMobile.html', function (err, data) {
      if (err) {
        console.log('error')
      }
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  })

  app.get('/exclude', function (req, res) {
    fs.readFile('exclude.html', function (err, data) {
      if (err) {
        console.log('error')
      }
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  })

  app.get('/gonogo', function (req, res) {
    const q = url.parse(req.url, true).query
    // logger.info(q.version);
    const fileurl = 'task/gonogo/version_' + q.version.toString() + '/gonogo' + q.version.toString() + '.html'
    fs.readFile(fileurl, function (err, data) {
      if (err) {
        console.log('error')
      }
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  })

  app.get('/square_circle_rating', function (req, res) {
    const fileurl = 'surveys/square_circle.html'
    fs.readFile(fileurl, function (err, data) {
      if (err) {
        console.log('error')
      }
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  })

  app.get('/chicken_estimate', function (req, res) {
    const q = url.parse(req.url, true).query
    displayChickenEstimate(res, q.pattern)
  })

  app.post('/wave1proceed', function (req, res) {
    // const q = url.parse(req.url, true).query
    // const session = q.session
    // const mkturk_id = q.mkturk_id
    // const survey = q.survey
    // const task = q.task

    processForm(req, res)
  })

  // POST SURVEY DATA
  app.post('/saveSurvey/', function (req, res) {
    const d = new Date()
    const q = url.URL(req.url, true).query
    const session = q.session
    const mturkId = q.mkturk_id
    const survey = q.survey
    const study = q.study
    // const task = q.task
    const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress

    const json = req.body
    logger.info(json)
    const month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
    const fileDate = d.getFullYear() + '_' + month + '_' + d.getDate() + '_' + d.getHours() + '_' + d.getMinutes()

    let outputString = survey + '-' + mturkId + '-' + 'T' + session + '-' + fileDate + ',"User Agent: ' + req.headers['user-agent'] + '",IP: ' + ipaddr + '\n'

    outputString = outputString + 'QUESTION,RESULT,RT(ms)\n'

    // var file = new File('surveys/data/SURVEY-' + survey +'-' + mturkId + '-T' + session + '.csv')

    // Iterage over the JSON Data
    let ques = ''
    let rt = ''
    let ans = ''

    for (const key in json) {
      // Check if TRQ

      if (/TRQ/.test(key)) {
        rt = json[key]
        continue // goes to next iteration
      } else {
        ques = key
        ans = json[key]
      }
      outputString = outputString + ques + ',"' + ans + '",' + rt + '\n'
    }
    let filename = 'data/' + study + '/surveys/' + study + '-SURVEY-' + survey + '-' + mturkId + '-T' + session + '.csv'

    // Don't delete this future james...
    // mindreall needs to keep track of pre-post sessions for the ratings survey
    if (study === 'mindreal') {
      filename = 'data/' + study + '/surveys/' + study + '-SURVEY-' + survey + '-' + mturkId + '-T' + session + '-' + q.subsesssion + '.csv'
    }

    fs.writeFile(filename, outputString, (err) => {
      // throws an error, you could also catch it here
      if (err) {
        logger.error('err', err)
      }
      // success case, the file was saved
      // console.log('File saved!');
      logger.info('file saved')

      // Copy the data to a shared folder in root to be accessed by other uses in the VM
      // This is done after writing the file
      fs.copyFile(filename, '/var/node_data/' + filename, (err) => {
        if (err) {
          logger.error('could not copy', err)
          // throw err;
        } else {
          logger.info('copy complete')
        }
      })
    })

    // csv.write('surveys/data/' + survey +'-' + mkturk_id + '-T' + session + '.csv', req.body, {header: 'question'});

    // Upload to Cloudinary
    // uploadToCloudinary(filename);

    // Update the Status Table in SQL
    // updateStatus(mturkId, survey, session, con, study)
    updateStatus(mturkId, survey, session, study)

    const response = {
      status: 200,
      success: 'Survey Data Saved'
    }

    res.send(JSON.stringify(response))
  })

  // This is the Save Task endppoint for Wave 1 of the test and retest
  app.post('/saveDPTask/', function (req, res) {
    const d = new Date()

    const month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
    const fileDate = d.getFullYear() + '_' + month + '_' + d.getDate() + '_' + d.getHours() + '_' + d.getMinutes()
    const q = url.parse(req.url, true).query
    const session = q.session
    const study = q.study
    const mturkId = q.mkturk_id
    // var survey = q.survey;
    const task = q.task
    const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress

    const data = req.body // json input
    const content = data.content
    const head1 = 'Orginal File Name:,' + 'DP-' + mturkId + '-' + fileDate + '.csv' + ',UserAGENT:' + req.headers['user-agent'] + ',IP: ' + ipaddr + ',Time:,' + fileDate + ",Parameter File:,None:FromPsyToolkit,Event Codes:,[('INSTRUCT_ONSET', 1), ('TASK_ONSET', 2), ('TRIAL_ONSET', 3), ('CUE_ONSET', 4), ('IMAGE_ONSET', 5), ('TARGET_ONSET', 6), ('RESPONSE', 7), ('ERROR_DELAY', 8), ('BREAK_ONSET', 9), ('BREAK_END', 10)],Trial Types are coded as follows: 8 bits representing [valence neut/neg/pos] [target_orientation H/V] [target_side left/right] [duration .5/1] [valenced_image left/right] [cue_orientation H/V] [cue_side left/right] \n"
    const head2 = 'trial_number,trial_type,event_code,absolute_time,response_time,response,result\n'

    // Write to File on current server
    const filename = 'data/' + study + '/tasks/' + study + '-DP-' + mturkId + '-' + 'T' + session + '.csv'
    fs.writeFile(filename, head1 + head2 + content, (err) => {
      if (err) throw err
      console.log(filename + ' DP saved!')
      // Copy the data to a shared folder in root to be accessed by other uses in the VM
      // This is done after writing the file
      fs.copyFile(filename, '/var/node_data/' + filename, (err) => {
        if (err) {
          console.log('could not copy')
          throw err
        } else {
          console.log('copy complete')
        }
      })
    })

    // add Time Ready so that the ready time initiates once Task1 has been completed
    addTimeReady(mturkId, study)
    // upload to cloudinary
    // uploadToCloudinary(filename);

    res.send('Got the Data')

    // Run the plot script
    // shell.cd('stats');
    // shell.exec('python makeHTMLplot.py ' + mturkId);
    // shell.exec('Rscript makePlot.r ' + mturkId);
    // shell.cd('..');

    // Update the Status
    // updateStatus(mturkId, task, session, con, study)
    updateStatus(mturkId, task, session, study)

    // // Send the Code by Email if they Include it
    sendEmails(mturkId, session, study)
  })

  app.post('/saveDC', function (req, res) {
    const d = new Date()
    const fields = ['datacamp_1', 'datacamp_2', 'datacamp_3', 'datacamp_4']
    // const opts = { fields }
    // const transformOpts = { highWaterMark: 16384, encoding: 'utf-8' }

    const data = req.body // json input

    console.log(data)

    // inputJSON = JSON.parse(data);

    const month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
    const fileDate = d.getFullYear() + '_' + month + '_' + d.getDate() + '_' + d.getHours() + '_' + d.getMinutes()

    let randomNUM = Math.floor(Math.random() * 100000) + 1
    let outputPath = 'data/datacamp/dc-' + randomNUM + '.csv'

    // const input = fs.createReadStream(data, { encoding: 'utf8' });
    // const output = fs.createWriteStream(outputPath, { encoding: 'utf8' });
    // eslint-disable-next-line no-undef
    const json2csvParser = new Json2csvParser({ fields })
    const csv = json2csvParser.parse(data)

    // console.log(csv)

    fs.stat(outputPath, function (err, stat) {
      // file exists, genereate new random number
      // eslint-disable-next-line no-unmodified-loop-condition
      while (err == null) {
        randomNUM = Math.floor(Math.random() * 100000) + 1
        outputPath = 'data/datacamp/dc-' + randomNUM + '.csv'
      }
      if (err.code === 'ENOENT') {
        // file does not exist
        fs.writeFile(outputPath, 'date:,' + fileDate + '\n' + csv, (err) => {
          if (err) throw err
          console.log(outputPath + ' DC saved!')
        })
      } else {
        console.log('Some other error: ', err.code)
      }
    })
    res.send('saved DC')
  })

  app.post('/saveSquareCircleRating', function (req, res) {
    const q = url.parse(req.url, true).query
    const d = new Date()
    // const fields = ['datacamp_1', 'datacamp_2', 'datacamp_3', 'datacamp_4']
    // const opts = { fields }
    // const transformOpts = { highWaterMark: 16384, encoding: 'utf-8' }

    const data = req.body // json input

    // console.log(data)

    // inputJSON = JSON.parse(data);

    const month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
    const fileDate = d.getFullYear() + '_' + month + '_' + d.getDate() + '_' + d.getHours() + '_' + d.getMinutes()

    let randomNUM = Math.floor(Math.random() * 100000) + 1
    if (q.id) {
      randomNUM = q.id
    }
    let outputPath = 'data/square_circle_rating/sc-' + randomNUM + '.csv'

    // const input = fs.createReadStream(data, { encoding: 'utf8' });
    // const output = fs.createWriteStream(outputPath, { encoding: 'utf8' });
    // const json2csvParser = new Json2csvParser({ fields })
    // const csv = json2csvParser.parse(data);
    let csv = ''
    Object.keys(data).forEach(function (key) {
      csv = csv + key + ',' + data[key] + '\n'
      // console.log(csv + key + ', Value : ' + data[key])
    })

    // console.log(csv)

    fs.stat(outputPath, function (err, stat) {
      // file exists, genereate new random number
      // eslint-disable-next-line no-unmodified-loop-condition
      while (err == null) {
        randomNUM = Math.floor(Math.random() * 100000) + 1
        outputPath = 'data/square_circle_rating/sc-' + randomNUM + '.csv'
      }
      if (err.code === 'ENOENT') {
        // file does not exist
        fs.writeFile(outputPath, 'date:,' + fileDate + '\n' + csv, (err) => {
          if (err) throw err
          console.log(outputPath + ' SC saved!')
        })
      } else {
        console.log('Some other error: ', err.code)
      }
    })
    res.send('saved SC')
  })

  // This is wave-2 saveTask endpoint that saves Chicken Task Data
  app.post('/saveChickenTask/', function (req, res) {
    const d = new Date()

    const month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers

    const fileDate = d.getFullYear() + '_' + month + '_' + d.getDate() + '_' + d.getHours() + '_' + d.getMinutes()
    const q = url.parse(req.url, true).query
    const session = q.session
    const study = q.study
    const mturkId = q.mkturk_id
    const pattern = q.pattern
    // var survey = q.survey;
    const task = q.task
    // var ipaddr = requestIp.getClientIp(req)
    const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const type = q.type

    const data = req.body // json input
    const content = data.content
    const head1 = 'Version,' + q.version + ',' + 'Pattern,' + pattern + ',Type,' + type + ',Orginal_File_Name,' + 'CT-' + mturkId + '-T' + session + '.csv,' + 'IP,' + ipaddr + ',Time,' + fileDate + ',chicken_left_x,-75,chicken_left_y,0,chicken_right_x,75,chicken_right_y,0,block1_sigma,110,block1_hazard,0.05,block2_sigma,160,block2_hazard,0.05,block3_sigma,110,block3_hazard,0.95,block4_sigma,160,block4_hazard,0.95' + ',Parameter_File,None:FromPsyToolkit' + ',UserAGENT,' + '"' + req.headers['user-agent'].replace(' ', '_') + '"\n'
    const head2 = 'trial_type,trial_number,block_num,egg_x_position,egg_y_position,absolute_time_sec,response_time_sec,response,current_chicken,next_chicken,correct,points,left_chicken_x_position,left_chicken_y_position,right_chicken_x_position,right_chicken_y_position,give_feedback\n'

    const filename = 'data/' + study + '/tasks/' + study + '-CT-' + mturkId + '-' + 'T' + session + '.csv'
    fs.writeFile(filename, head1 + head2 + content, (err) => {
      if (err) throw err
      console.log('Saved Chicken Task Data!')
    })

    // add Time Ready on session 1 only o that the ready time initiates once Task1 has been completed
    if (session === '1') {
      addTimeReady(mturkId, study)
      // advance = advanceAfterPractice(data.content)
    }

    // updateStatus(mturkId, task, session, con, study)
    updateStatus(mturkId, task, session, study)

    // upload to cloudinary
    // uploadToCloudinary(filename);

    // Send Emails
    // // Send the Code by Email if they Include it
    sendEmails(mturkId, session, study, advanceAfterPractice(data.content))

    const response = {
      status: 200,
      success: 'Chicken Task Data Saved Data Saved',
      advance: advanceAfterPractice(data.content)
    }
    console.log(response)
    res.send(JSON.stringify(response))
  })

  // Save GoNoGo Task

  // Save The input of a file and if its' the same
  // id, study, and session, APPEND it
  app.post('/saveGoNoGo', (req, res) => {
    const q = url.parse(req.url, true).query

    const payload = req.body // json input
    const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const d = new Date()
    const month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
    const fileDate = d.getFullYear() + '_' + month + '_' + d.getDate() + '_' + d.getHours() + '_' + d.getMinutes()

    const data = payload[0]

    const filename = 'data/wave3/tasks/wave3-GT-' + q.id + '-T' + q.session + '.csv'
    const head1 = 'Version:,' + q.version + ',Orginal File Name:,' + 'GT-' + q.id + '-T' + q.session + '.csv' + ',"UserAGENT:' + req.headers['user-agent'] + '",IP: ' + ipaddr + ',Time:,' + fileDate + ',Parameter File:,None:FromjsPsych\n'
    const head2 = 'trial_index,trial_type,trial_number,event,condition,absolute_time_ms,response_time_ms,key_press,outcome,points\n'
    const datarow = data.trial_index + ',' + data.trial_type + ',' + data.trial_number + ',' +
            data.test_part + ',' + data.result + ',' + data.time_elapsed + ',' +
            data.rt + ',' + data.key_press + ',' + data.outcome + ',' + data.points + '\n'
    // If File Exists, Append the payload
    if (fs.existsSync(filename)) {
      fs.appendFile(filename, datarow.replace('null', '').replace(undefined, ''), function (err) {
        if (err) throw err
        console.log('Append GT data!')
        console.log(datarow)
      })
    } else {
      // Create new File
      fs.writeFile(filename, head1 + head2 + datarow.replace('null', '').replace(undefined, ''), (err) => {
        if (err) throw err
        console.log('New GT File Created')
      })
    }

    res.send('Got the GoNoGo Task Data')
  })

  // Save Flanker Task

  // Save The input of a file and if its' the same
  // id, study, and session, APPEND it
  app.post('/saveFlanker', (req, res) => {
    const q = url.parse(req.url, true).query

    const payload = req.body // json input
    const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const d = new Date()
    const month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
    const fileDate = d.getFullYear() + '_' + month + '_' + d.getDate() + '_' + d.getHours() + '_' + d.getMinutes()

    const data = payload[0]

    const savePath = 'data/cognitive_control/tasks/flanker/'

    const filename = savePath + 'cognitive_control-FL-' + q.subject + '-T' + q.session + '.csv'
    const head1 = 'Version:,' + q.version + ',Orginal File Name:,' + 'FL-' + q.subject + '-T' + q.session + '.csv' + ',IP: ' + ipaddr + ',Time:,' + fileDate + ',Parameter File:,None:FromjsPsych,UserAGENT:"' + req.headers['user-agent'] + '"\n'
    const head2 = 'trial_index,trial_type,trial_number,event,direction,congruency,absolute_time_ms,response_time_ms,key_press,result\n'
    const datarow = data.trial_index + ',' + data.symbol + ',' + data.trial_number + ',' +
            data.test_part + ',' + data.direction + ',' + data.congruency + ',' + data.time_elapsed + ',' +
            data.rt + ',' + data.key_press + ',' + data.result + '\n'
    // If File Exists, Append the payload
    if (fs.existsSync(filename)) {
      fs.appendFile(filename, datarow.replace('null', '').replace(undefined, ''), function (err) {
        if (err) throw err
        console.log('Append FL data!')
        console.log(datarow)
      })
    } else {
      // Create new File
      fs.writeFile(filename, head1 + head2 + datarow.replace('null', '').replace(undefined, ''), (err) => {
        if (err) throw err
        console.log('New FL File Created')
      })
    }

    res.send('Got the Flanker Task Data')
  })

  // Save Color Stroop Task

  // Save The input of a file and if its' the same
  // id, study, and session, APPEND it
  app.post('/saveColorStroop', (req, res) => {
    const q = url.parse(req.url, true).query

    const payload = req.body // json input
    const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const d = new Date()
    const month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
    const fileDate = d.getFullYear() + '_' + month + '_' + d.getDate() + '_' + d.getHours() + '_' + d.getMinutes()

    const data = payload[0]

    const savePath = 'data/cognitive_control/tasks/color_stroop/'

    const filename = savePath + 'cognitive_control-Color_Stroop-' + q.subject + '-T' + q.session + '.csv'
    const head1 = 'Version:,' + q.version + ',Orginal File Name:,' + 'Color_Stroop-' + q.subject + '-T' + q.session + '.csv' + ',IP: ' + ipaddr + ',Time:,' + fileDate + ',Parameter File:,None:FromjsPsych,UserAGENT:"' + req.headers['user-agent'] + '"\n'
    const head2 = 'trial_index,trial_type,trial_number,event,direction,congruency,absolute_time_ms\n'
    const datarow = data.trial_index + ',' + data.symbol + ',' + data.trial_number + ',' +
            data.test_part + ',' + data.direction + ',' + data.congruency + ',' + data.time_elapsed + ',' +
            '\n'
            // If File Exists, Append the payload
    if (fs.existsSync(filename)) {
      fs.appendFile(filename, datarow.replace('null', '').replace(undefined, ''), function (err) {
        if (err) throw err
        console.log('Appending ColorStroop data!')
        console.log(datarow)
      })
    } else {
      // Create new File
      fs.writeFile(filename, head1 + head2 + datarow.replace('null', '').replace(undefined, ''), (err) => {
        if (err) throw err
        console.log('New ColorStroop File Created')
      })
    }
    res.send('Got the Color Stropp Task Data')
  })

  // Save Color Stroop Task

  // Save The input of a file and if its' the same
  // id, study, and session, APPEND it
  app.post('/saveEmotionalStroop', (req, res) => {
    const q = url.parse(req.url, true).query

    const payload = req.body // json input
    const ipaddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const d = new Date()
    const month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
    const fileDate = d.getFullYear() + '_' + month + '_' + d.getDate() + '_' + d.getHours() + '_' + d.getMinutes()

    const data = payload[0]

    const savePath = 'data/cognitive_control/tasks/emotional_stroop/'

    const filename = savePath + 'cognitive_control-Emotional_Stroop-' + q.subject + '-T' + q.session + '.csv'
    const head1 = 'Version:,' + q.version + ',Orginal File Name:,' + 'Emotional_Stroop-' + q.subject + '-T' + q.session + '.csv' + ',IP: ' + ipaddr + ',Time:,' + fileDate + ',Parameter File:,None:FromjsPsych,UserAGENT:"' + req.headers['user-agent'] + '"\n'
    const head2 = 'trial_index,trial_type,trial_number,event,direction,congruency,absolute_time_ms\n'
    const datarow = data.trial_index + ',' + data.symbol + ',' + data.trial_number + ',' +
            data.test_part + ',' + data.direction + ',' + data.congruency + ',' + data.time_elapsed + ',' +
            '\n'
            // If File Exists, Append the payload
    if (fs.existsSync(filename)) {
      fs.appendFile(filename, datarow.replace('null', '').replace(undefined, ''), function (err) {
        if (err) throw err
        console.log('Appending Emotional Stroop data!')
        console.log(datarow)
      })
    } else {
      // Create new File
      fs.writeFile(filename, head1 + head2 + datarow.replace('null', '').replace(undefined, ''), (err) => {
        if (err) throw err
        console.log('New Emotional Stroop File Created')
      })
    }
    res.send('Got the Emotional Stroop Task Data')
  })

  // app.post('/saveAudio', (req, res) => {
  //     var q = url.parse(req.url, true).query;
  //     console.log('saving Audio Post requested');
  //     // console.log(req.body)
  //     base64 = req.body.base64data

  //     var data = base64.replace(/^data:audio\/\w+;base64,/, '');
  //     // var buffer = new Buffer(req.body.audio, 'base64'); // decode

  //     savePath = 'data/cognitive_control/audio/' + q.task + '/'
  //     filename = savePath + q.task + '-' + q.subject + '-' + 'B' + q.block + '-' + 'T' + q.session + '.wav'

  //     console.log('saving...' + filename);
  //     fs.writeFile(filename, data, { encoding: 'base64' }, function(err) {
  //         if (err) {
  //             console.log("err", err);
  //         } else {
  //             return res.json({ 'status': 'success' });
  //         }
  //     });
  // })

  // Return Time Life given id
  app.get('/getTimeReady', function (req, res) {
    const q = url.parse(req.url, true).query
    const mturkId = q.mkturk_id

    const study = q.study

    if (study === 'wave2') {
      res.send(wave2.getTimeReady(mturkId))
    }

    const sql = SqlString.format('SELECT time_ready FROM dot_probe1 WHERE mkturk_id = ?', [mturkId])
    // console.log(sql);
    con.query(sql, function (err, result) {
      if (err) {
        console.log('err')
      }
      try {
        const sqlresult = JSON.parse(JSON.stringify(result))
        const jsondata = sqlresult[0]
        // console.log(jsondata);
        res.send(jsondata.time_ready)
        // res.end();
      } catch (err) {
        console.log('error getTImeReady Request')
        console.log(err)
      }
    })
  })

  // Return the phq score of the given mkturk_id
  app.get('/getPHQ', function (req, res) {
    const q = url.parse(req.url, true).query
    const mturkId = q.mkturk_id
    const session = q.session
    const study = q.study
    const filename = 'data/' + study + '/surveys/' + study + '-SURVEY-' + 'phq' + '-' + mturkId + '-T' + session + '.csv'
    res.send(getPHQScore(filename))
  })

  app.get('/getOASIS', function (req, res) {
    const q = url.parse(req.url, true).query
    const mturkId = q.mkturk_id
    const session = q.session
    const study = q.study
    const filename = 'data/' + study + '/surveys/' + study + '-SURVEY-' + 'oasis' + '-' + mturkId + '-T' + session + '.csv'

    // oasis sums up scores the same as phq
    res.send(getPHQScore(filename))
  })

  // Get the ASI Score,
  // Total
  // physical
  // cognitive
  // social
  app.get('/getASI', function (req, res) {
    const q = url.parse(req.url, true).query
    const mturkId = q.mkturk_id
    // var type = q.type;

    const filename = 'surveys/data/SURVEY-asi-' + mturkId + '-T2.csv'
    let value = 'not specified'
    switch (q.type) {
      case 'total':
        value = getASITotal(filename)
        break
      case 'physical':
        value = getASIPhysical(filename)
        break
      case 'cognitive':
        value = getASICognitive(filename)
        break
      case 'social':
        value = getASISocial(filename)
        break
    }
    // console.log(value);

    res.send(value)
  })

  app.get('/getPANAS', function (req, res) {
    const q = url.parse(req.url, true).query
    const mturkId = q.mkturk_id
    const session = q.session
    const study = q.study
    const filename = 'data/' + study + '/surveys/' + study + '-SURVEY-' + 'panas' + '-' + mturkId + '-T' + session + '.csv'

    let value = 'not specified'
    switch (q.type) {
      case 'positive':
        value = getPANASPositive(filename)
        break
      case 'negative':
        value = getPANASNegative(filename)
        break
    }
    // console.log(value);

    res.send(value)
  })

  app.get('/getScores', (req, res) => {
    const q = url.parse(req.url, true).query
    const mturkId = q.mkturk_id
    // const session = q.session
    const study = q.study
    const jsonReturn = {}
    // var filename = 'data/' + study + '/surveys/' + study +'-SURVEY-' + 'panas' + '-' + mkturk_id + '-T' + session + '.csv'

    jsonReturn.PANASX = {
      T1: getPANASXScore('data/' + study + '/surveys/' + study + '-SURVEY-' + 'panasx' + '-' + mturkId + '-T' + '1' + '.csv'),
      T2: getPANASXScore('data/' + study + '/surveys/' + study + '-SURVEY-' + 'panasx' + '-' + mturkId + '-T' + '2' + '.csv')
    }

    jsonReturn.ChickenTask = {
      T1: getChickenTaskScore('data/' + study + '/tasks/' + study + '-CT-' + mturkId + '-T' + '1' + '.csv'),
      T2: getChickenTaskScore('data/' + study + '/tasks/' + study + '-CT-' + mturkId + '-T' + '2' + '.csv')
    }
    res.send(jsonReturn)
  })

  // 404 Page
  app.get('/*', (req, res) => {
    display404(res)
    // es.send('404. We cant find that bro.');
  })

  function getChickenTaskScore (filename) {
    try {
      const stringContent = fs.readFileSync(filename).toString()
      const contents = toArrayfromCSVString(stringContent)
      const returnJSON = {}

      returnJSON.points = '0'
      returnJSON.avg_rt = 0

      for (let i = 2; i < contents.length - 1; i++) {
        if (filename.includes('wave2') && contents[i][1] === '1200') {
          returnJSON.points = contents[i][9]
        }
        if (filename.includes('wave3') && contents[i][1] === '400') {
          returnJSON.points = contents[i][11]
        }

        if (contents[i][0] === 'main') {
          returnJSON.avg_rt = returnJSON.avg_rt + parseFloat(contents[i][6].replace('\"', ''))
        }
      }
      returnJSON.avg_rt = returnJSON.avg_rt / 400
      console.log(returnJSON)
      return (returnJSON)
    } catch (err) {
      return ({})
    }
  }

  /**
    * Returns false if they did poorly on task
    * @param {JSON} ctcontent Chicken Task Data content from psytoolkit
    */
  function advanceAfterPractice (ctcontent) {
    // console.log(ctcontent)
    if (ctcontent === '') { return false }
    try {
      const lines = ctcontent.split('\n')
      let practice1Point = 20
      let practice2Point = 20
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(',')

        if (cols[0] === 'practice1') {
          practice1Point = cols[11]
        }
        if (cols[0] === 'practice2') {
          practice2Point = cols[11]
        }
      }

      // If They got less than 13 for either practice blocks, then did did poorlay
      if ((parseInt(practice1Point) < 13) || (parseInt(practice2Point) < 13)) {
        return false
      } else {
        return true
      }
    } catch (err) {
      // Given Data
      console.log(ctcontent)
      console.log(err)
      return false
    }
  }

  /**
    * This returns a json object of differente score types from PANAX form.
    * @param {String} filename The Path to the panax output file
    */
  function getPANASXScore (filename) {
    try {
      const stringContent = fs.readFileSync(filename).toString()
      const contents = toArrayfromCSVString(stringContent)
      const panasx_negaffect_score = ['panasx_afraid', 'panasx_scared', 'panasx_nervous', 'panasx_jittery', 'panasx_irritable', 'panasx_hostile', 'panasx_guilty', 'panasx_ashamed', 'panasx_upset', 'panasx_distressed']
      const panasx_posaffect_score = ['panasx_active', 'panasx_alert', 'panasx_attentive', 'panasx_determined', 'panasx_enthusiastic', 'panasx_excited', 'panasx_inspired', 'panasx_interested', 'panasx_proud', 'panasx_strong']
      const panasx_fear_score = ['panasx_afraid', 'panasx_scared', 'panasx_frightened', 'panasx_nervous', 'panasx_jittery', 'panasx_shaky']
      const panasx_hostility_score = ['panasx_angry', 'panasx_hostile', 'panasx_irritable', 'panasx_scornful', 'panasx_disgusted', 'panasx_loathing']
      const panasx_guilt_score = ['panasx_guilty', 'panasx_ashamed', 'panasx_blameworthy', 'panasx_angryself', 'panasx_disgustedself', 'panasx_dissatisfiedself']
      const panasx_sadness_score = ['panasx_sad', 'panasx_blue', 'panasx_downhearted', 'panasx_alone', 'panasx_lonely']
      const panasx_joviality_score = ['panasx_happy', 'panasx_joyful', 'panasx_delighted', 'panasx_cheerful', 'panasx_excited', 'panasx_enthusiastic', 'panasx_lively', 'panasx_energetic']
      const panasx_selfassurance_score = ['panasx_proud', 'panasx_strong', 'panasx_confident', 'panasx_bold', 'panasx_daring', 'panasx_fearless']
      const panasx_attentiveness_score = ['panasx_alert', 'panasx_attentive', 'panasx_concentrating', 'panasx_determined']
      const panasx_shyness_score = ['panasx_shy', 'panasx_bashful', 'panasx_sheepish', 'panasx_timid']
      const panasx_fatigue_score = ['panasx_sleepy', 'panasx_tired', 'panasx_sluggish', 'panasx_drowsy']
      const panasx_serenity_score = ['panasx_calm', 'panasx_relaxed', 'panasx_atease']
      const panasx_surprise_score = ['panasx_amazed', 'panasx_surprised', 'panasx_astonished']

      returnJSON = {}
      returnJSON.panasx_negaffect_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_negaffect_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_negaffect_score = returnJSON.panasx_negaffect_score + value
        }
      }
      returnJSON.panasx_posaffect_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_posaffect_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_posaffect_score = returnJSON.panasx_posaffect_score + value
        }
      }
      returnJSON.panasx_fear_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_fear_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_fear_score = returnJSON.panasx_fear_score + value
        }
      }
      returnJSON.panasx_hostility_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_hostility_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_hostility_score = returnJSON.panasx_hostility_score + value
        }
      }
      returnJSON.panasx_guilt_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_guilt_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_guilt_score = returnJSON.panasx_guilt_score + value
        }
      }
      returnJSON.panasx_sadness_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_sadness_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_sadness_score = returnJSON.panasx_sadness_score + value
        }
      }
      returnJSON.panasx_joviality_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_joviality_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_joviality_score = returnJSON.panasx_joviality_score + value
        }
      }
      returnJSON.panasx_selfassurance_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_selfassurance_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_selfassurance_score = returnJSON.panasx_selfassurance_score + value
        }
      }
      returnJSON.panasx_attentiveness_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_attentiveness_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_attentiveness_score = returnJSON.panasx_attentiveness_score + value
        }
      }
      returnJSON.panasx_shyness_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_shyness_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_shyness_score = returnJSON.panasx_shyness_score + value
        }
      }
      returnJSON.panasx_fatigue_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_fatigue_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_fatigue_score = returnJSON.panasx_fatigue_score + value
        }
      }
      returnJSON.panasx_serenity_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_serenity_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_serenity_score = returnJSON.panasx_serenity_score + value
        }
      }
      returnJSON.panasx_surprise_score = 0
      for (var i = 2; i < contents.length - 1; i++) {
        if (panasx_surprise_score.includes(contents[i][0])) {
          // console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
          var value = parseInt(contents[i][1].replace('\"', ''))
          returnJSON.panasx_surprise_score = returnJSON.panasx_surprise_score + value
        }
      }
      return (returnJSON)
    } catch (err) {
      return ({})
    }
  }

  function getPANASPositive (filename) {
    const stringContent = fs.readFileSync(filename).toString()
    const contents = toArrayfromCSVString(stringContent)
    q_num = [1, 3, 5, 9, 10, 12, 14, 16, 17, 19]

    // Value should be + 1 more since the suryve has fields like:
    // 0|Very slightly or not at all
    // 1|A little
    // 2|Moderately
    // 3|Quite a bit
    // 4|Extremely

    // Scoring should be:
    // 1|Very slightly or not at all
    // 2|A little
    // 3|Moderately
    // 4|Quite a bit
    // 5|Extremely
    let Total = 0
    for (let i = 2; i < contents.length - 1; i++) {
      if (q_num.includes(i - 1)) {
        const value = parseInt(contents[i][1]) + 1
        Total = Total + value
      }
    }
    return Total.toString()
  }

  function getPANASNegative (filename) {
    const stringContent = fs.readFileSync(filename).toString()
    const contents = toArrayfromCSVString(stringContent)
    q_num = [2, 4, 6, 7, 8, 11, 13, 15, 18, 20]

    let Total = 0
    for (let i = 2; i < contents.length - 1; i++) {
      if (q_num.includes(i - 1)) {
        const value = parseInt(contents[i][1]) + 1
        Total = Total + value
      }
    }
    return Total.toString()
  }

  function getASITotal (filename) {
    const stringContent = fs.readFileSync(filename).toString()
    const contents = toArrayfromCSVString(stringContent)
    let Total = 0
    for (let i = 2; i < contents.length - 1; i++) {
      value = parseInt(contents[i][1])
      Total = Total + value
      // console.log(value);
    }
    // console.log(Total)
    return Total.toString()
  }

  function getASIPhysical (filename) {
    const stringContent = fs.readFileSync(filename).toString()
    const contents = toArrayfromCSVString(stringContent)
    q_num = [4, 12, 8, 7, 15, 3]

    let Total = 0
    for (let i = 2; i < contents.length - 1; i++) {
      if (q_num.includes(i - 1)) {
        const value = parseInt(contents[i][1])
        Total = Total + value
      }
    }
    return Total.toString()
  }

  function getASICognitive (filename) {
    const stringContent = fs.readFileSync(filename).toString()
    const contents = toArrayfromCSVString(stringContent)
    q_num = [14, 18, 10, 16, 2, 5]

    let Total = 0
    for (let i = 2; i < contents.length - 1; i++) {
      if (q_num.includes(i - 1)) {
        const value = parseInt(contents[i][1])
        Total = Total + value
      }
    }
    return Total.toString()
  }

  function getASISocial (filename) {
    const stringContent = fs.readFileSync(filename).toString()
    const contents = toArrayfromCSVString(stringContent)
    q_num = [9, 6, 11, 13, 17, 1]

    let Total = 0
    for (let i = 2; i < contents.length - 1; i++) {
      if (q_num.includes(i - 1)) {
        const value = parseInt(contents[i][1])
        Total = Total + value
      }
    }
    return Total.toString()
  }

  // Will return the phq score given the survey filename
  function getPHQScore (filename) {
    const stringContent = fs.readFileSync(filename).toString()
    const contents = toArrayfromCSVString(stringContent)

    let Total = 0
    // skips the first line
    for (let i = 2; i < contents.length - 1; i++) {
      question = contents[i][0]
      value = parseInt(contents[i][1])

      Total = Total + value
      // Total = Total + value
      // if (value != ''){
      // 	Total = Total + parseInt(value)
      // }
    }
    return Total.toString()
  }

  function toArrayfromCSVString (string) {
    const line = string.split('\n')
    const x = new Array(line.length)
    for (let i = 0; i < line.length; i++) {
      x[i] = line[i].split(',')
    }

    return x
  }

  // 			Output Pages 		//
  function displayHome (res) {
    fs.readFile('index.html', function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  function displaySurveydemo (res) {
    fs.readFile('surveys/demo.html', function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  function displaySurveyphq (res) {
    fs.readFile('surveys/phq.html', function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  function displayFeedback (res) {
    fs.readFile('surveys/feedback.html', function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  function displayDataCampSurvey (res) {
    fs.readFile('surveys/datacamp.html', function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  function displayAssessment (res) {
    fs.readFile('surveys/asessment_questions.html', function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  function displayTest (res) {
    fs.readFile('task/dotprobe1-5Trial.html', function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  function display404 (res) {
    fs.readFile('404.html', function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  function displayChickenEstimate (res, version) {
    if (version == undefined) {
      version = '1'
    }
    filename = 'task/chicken_task/estimate_version/pattern_' + version + '.html'
    fs.readFile(filename, function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      // console.log(data)
      res.write(data)
      res.end()
    })
  }

  function displayChickenPredict2 (res, query) {
    console.log(query)

    // If Version is specified, show them the folder
    if (query.version && query.pattern) {
      filename = path.join('task', 'chicken_task', 'predict_version2', query.version, 'pattern_' + query.pattern + '.html')
    } else {
      // Use the most recent in the root_folder
      // Default if other parameters aren't given
      filename = 'task/chicken_task/predict_version2/T1/pattern_1.html'
    }

    console.log(filename)

    fs.readFile(filename, function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      // console.log(data)
      res.write(data)
      res.end()

      if (err) {
        console.log('file does not exitss')
        display404(res)
      }
    })
  }

  function displayTask (task, req, res, query) {
    logger.info(`task requested: ${task} by ${query.id}`)

    if (task == 'cooperation_task') {
      // For the cooperation_task, it needs to be behind a password protected page since
      // it uses IAPS/IADS media
      const reject = () => {
        res.setHeader('www-authenticate', 'Basic')
        res.sendStatus(401)
      }

      const authorization = req.headers.authorization

      if (!authorization) {
        return reject()
      }

      const [username, password] = Buffer.from(
        authorization.replace('Basic ', ''),
        'base64'
      )
        .toString()
        .split(':')

      if (!(username === process.env.IAPS_USER && password === process.env.IAPS_PASSWORD)) {
        return reject()
      }
    }

    fs.readFile(`public/js/tasks/${task}/index.html`, function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  function displaySurvey(survey, res) {
    console.log('survey requested')
    logger.info('survey requested: ' + survey)
    fs.readFile(`public/js/surveys/${survey}/index.html`, function (err, data) {
      if (err) {
        console.log(err.stack)
      }
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }
  function display24HourPage (res) {
    fs.readFile('tooearly.html', function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  function displayCompleted (res) {
    fs.readFile('completed.html', function (err, data) {
      // Write Header
      res.writeHead(200, {
        'Content-Type': 'text/html'
      })
      // Wrte Body
      res.write(data)
      res.end()
    })
  }

  // SENDHTML CODES
  function getRemindHTML (mturkId, study) {
    const session2Link = 'http://brainworkout.paulus.libr.net/?session=2&mkturk_id=' + mturkId + '&survey=demo' + '&study=' + study
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>You may now perform session 2! </title>
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
                                height: 70px;" src="http://brainworkout.paulus.libr.net/images/logo.png"></a></center>
                            </td>

                        </tr>
                        <tr>
                            <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="color: #153643; font-family: Arial, sans-serif; font-size: 24px;">
                                            <b>Session 2 is ready for you to complete!</b>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                                            Hello ${mturkId}!
                                            <br>
                                            It has been 24 hours since you finished session 1, and can now complete session 2 of
                                            this HIT!

                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                                            Click the link below to take you to session 2!!
                                            <br>

                                            ${session2Link}

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

  function getCodeEmailHTML () {
    return `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Code for LIBR Mechanical Turk</title>
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
                            height: 70px;" src="http://brainworkout.paulus.libr.net/images/logo.png"></a></center>
                            </td>

                        </tr>
                        <tr>
                            <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="color: #153643; font-family: Arial, sans-serif; font-size: 24px;">
                                            <center><b>Thank you for your participation!!</b></center>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                                            Hello !
                                            <br>
                                            The code for the Mechanical Turk HIT is:
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 50px; line-height: 20px;">
                                            <center>11853</center>
                                        </td>

                                    </tr>
                                    <tr>
                                        <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                                            Enter this code on Amazon Mechanical Turk HIT to recieve payment. If you have any questions email us at:
                                            <a href="mailto:jtouthang@libr.net">jtouthang@libr.net</a>
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
    </html>
        `
  }

  // Add the Time Ready in the SQL Table
  function addTimeReady (mturkId, study) {
    if (study == 'wave2') {
      wave2.addTimeReady(mturkId)
      return
    }

    if (study == 'wave3') {
      wave3.addTimeReady(mturkId)
      return
    }

    const currentdate = new Date()
    const next24hrdate = getFuture24Date(currentdate, 24) // Date 24 hours from the currentdate object
    // console.log('Updating Time Ready..' + next24hrdate);
    sql = SqlString.format('INSERT INTO dot_probe1 (mkturk_id, time_ready) ' +
            'VALUES ( ? , "' + next24hrdate + '" ) ' +
            'ON DUPLICATE KEY UPDATE time_ready="' + next24hrdate + '\"', [mturkId])

    console.log(sql)
    con.query(sql, function (err, result) {
      try {
        console.log('Added time_ready for ' + mturkId + ' at ' + next24hrdate)
        // response.writeHead(301,{Location : '/tooearly?&mkturk_id=' + mkturk_id + '&timeleft=' + next24hrdate });
        // response.end();
      } catch (err) {
        console.log('Failed Added time Ready..')
        console.log(err)
      }
    })
  }

  // Updates the DP_status
  // mkturk_id: their Mechanical TURK ID
  // job: The survey or the task

  function updateStatus (mturkId, job, session, con, study) {
    if (study == 'wave2') {
      wave2.updateStatus(mturkId, job, session)
      return
      // exit from the function since we don't want to run the code snippet below
    }
    if (study == 'wave3') {
      wave3.updateStatus(mturkId, job, session)
      return
      // exit from the function since we don't want to run the code snippet below
    }
    if (study == 'mindreal') {
      mindreal.updateStatus(mturkId, job, session)
      return
    }

    const jobToSqlColumn = {
      demo_1: 'survey_demo_T1',
      demo_2: 'survey_demo_T2',
      phq_1: 'survey_phq_T1',
      phq_2: 'survey_phq_T2',
      oasis_1: 'survey_oasis_T1',
      oasis_2: 'survey_oasis_T2',
      panas_1: 'survey_panas_T1',
      panas_2: 'survey_panas_T2',
      dotprobe_1: 'task_dotprobe_T1',
      dotprobe_2: 'task_dotprobe_T2'
    }

    colname = jobToSqlColumn[job + '_' + session]

    // sql = "INSERT INTO dp_status (mkturk_id, " + colname + ") " +
    // "VALUES (" + mkturk_id + ",\'YES\') " +
    // "ON DUPLICATE KEY UPDATE " + colname + "=\'YES\'";
    sql = SqlString.format('INSERT INTO dp_status (mkturk_id, ' + colname + ' ) ' +
            "VALUES ( ? ,\'YES\') " +
            'ON DUPLICATE KEY UPDATE ' + colname + "=\'YES\';", [mturkId])
    // console.log(sql);

    con.query(sql, function (err, result) {
      // Throws error bcause subject is not in the database/ :)
      try {
        // console.log('sql output is not empty')

        console.log('Updating..' + mturkId + ': ' + colname)
        // sendEmailCode(jsondata.email);
      } catch (err) {
        console.log('Failed Updating..')
        // Do Nothing
      }
    })
  }

  // Send the user to the survey or task that they have not completed yet
  // This function isn't used at the moment...
  // reroute is done client side
  function reRoute (con, mturkId, response) {
    console.log('reroute has been summoned :D')
    // THIS function can only be run if user is already in the database
    const sql = SqlString.format('SELECT dp_status.survey_demo_T1, ' +
            'dp_status.survey_phq_T1,' +
            'dp_status.survey_oasis_T1,' +
            'dp_status.survey_panas_T1,' +
            'dp_status.task_dotprobe_T1,' +
            'dot_probe1.time_ready,' +
            'dp_status.survey_demo_T2,' +
            'dp_status.survey_phq_T2,' +
            'dp_status.survey_oasis_T2,' +
            'dp_status.survey_panas_T2,' +
            'dp_status.task_dotprobe_T2 ' +
            'FROM dp_status ' +
            'LEFT JOIN dot_probe1 ON dp_status.mkturk_id = dot_probe1.mkturk_id ' +
            'WHERE dot_probe1.mkturk_id = ?', [mturkId])

    // console.log(sql);

    // response.redirect('/?mkturk_id=JT&survey=demo&session=1');

    con.query(sql, function (err, result) {
      try {
        // console.log('sql output is not empty')
        sqlresult = JSON.parse(JSON.stringify(result))
        obj = sqlresult[0]

        lastYesKey = ''
        lastJob = ''
        lastName = ''
        lastSession = ''
        value = ''
        timeReady = ''

        // get the key with the last 'YES' status and the time_ready value

        console.log(obj)
        for (const key in obj) {
          const val = obj[key]
          // console.log('key: ' + key + ',' + obj[key]);

          // Parse the keys

          jobs = parseKey(key)
          const job = jobs[0]
          const name = jobs[1]
          const session = jobs[2]

          // if (val == 'YES') {
          // 	// store the key with the last 'YES' value column will be stored
          // 	lastYesKey = key;
          // 	lastJob = job;
          // 	lastName = name;
          // 	lastSession = session;
          // }

          // if (job == 'time'){
          // 	timeReady = val;
          // }

          // console.log('job: ' + job + '\tname: ' + name + '\tsession: ' + session + '\tvalue: ' + val);
          // console.log(mkturk_id + ':' + job + ':' + name + ':' + val);
          if (val == null) {
            console.log('redirect..')
            // response.redirect('/?&mkturk_id=' + mkturk_id + '&' + job + '=' + 'asi' + '&session=' + session)
            // this.statusCode = 302;
            response.writeHead(301, { Location: '/?study=wave1&mkturk_id=' + mturkId + '&' + job + '=' + name + '&session=' + session })
            response.end()
            break
          } else if (job == 'time' && isReady(val)) {
            // completed session 1

            console.log('did all session 1 and  is ready for session 2')
            // 		response.writeHead(301,{Location : '/?&mkturk_id=' + mkturk_id + '&' + job + '=' + name + '&session=' + session });
            // response.end();
            continue
          } else if (job == 'time' && !isReady(val)) {
            console.log('did all session 1 and is too early...')
            response.writeHead(301, { Location: '/tooearly?study=wave1&mkturk_id=' + mturkId + '&timeleft=' + val })
            response.end()
            break
          } else if (job == 'task' && session == '2') {
            console.log('did all session 1 and 2!')
            response.writeHead(301, { Location: '/completed?&mkturk_id=' + mturkId })
            response.end()
            break
          } else {
            // value is not null,
            // Already did this so skip to the next  key

            continue
          }

          // console.log('job: ' + job + '\tname: ' + name + '\tsession: ' + session + '\tvalue: ' + val);
        }

        // Did all Session 1 and Session 2!!

        // Route them to their last YES job
        // if (lastSession == '1' && lastJob == 'task'){
        // 	// need to check if it's been 24 hours
        // 	if(isReady(timeReady)){
        // 		res.writeHead(301, {
        // 			Location: '/?session=2&mkturk_id=' + mkturk_id + '&' + job + '=' + name
        // 		});
        //       res.end();
        // 	}else {
        // 		// premature check. user is too early!
        // 		res.writeHead(301, {
        // 			Location: '/tooearly&mkturk_id=' + mkturk_id + '&timeleft=' + timeReady
        // 		});
        //       res.end();
        // 	}

        // } else if (lastSession == '1' && lastJob == 'survey'){

        // 	// takes them to their last survey the didn't finish
        // 	res.writeHead(301, {
        // 		Location: '/?session=' + lastSession + '&mkturk_id=' + mkturk_id + '&' + job + '=' + name
        // 	});
        //      res.end();

        // } else if (lastSession == '2' && lastJob == 'survey'){

        // 	res.writeHead(301, {
        // 		Location: '/?session=' + lastSession + '&mkturk_id=' + mkturk_id + '&' + job + '=' + name
        // 	});
        //      res.end();
        // } else if (lastSession == '2' && lastJob == 'task'){
        // 	// subject has completed any of them!!		  	}

        // 	res.writeHead(301, {
        // 		Location: '/?completed=' + lastSession + '&mkturk_id=' + mkturk_id
        // 	});
        //      res.end();
        // }
        // All Conditions have been a yes, user is finished with this HIT
      } catch (err) {
        console.log(err)
        // Do Nothing
      }
    })
  }

  // Return True if the subject has past the 24 hour period
  function isReady (dateString) {
    date = new Date(dateString)

    now = new Date()
    if ((date.getTime() - now.getTime()) <= 0) {
      return true
    } else {
      return false
    }
  }

  // Returns the array of job, name and session
  // example: survey_demo_T2

  // return [survey, demo, 2]

  function parseKey (key) {
    job = key.substring(0, key.search('_'))
    name = key.substring(key.search('_') + 1, key.lastIndexOf('_'))
    session = key.substring(key.lastIndexOf('_') + 2, key.lastIndexOf('_') + 3)
    return [job, name, session]
  }

  // Returns Data object that is 24hours from the passed in DataObject
  function getFuture24Date (dateobject, numHours) {
    // getTime() gets the time in ms, so we add 8.64E7 which is the number of ms in 24 hours

    // changed later to 30 hours because for some reason, mailgun sends it prematurely
    const dateTime = new Date(dateobject.getTime() + 60 * 60 * numHours * 1000)
    return dateTime
  }

  function getFormattedDate (dateobject) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const weekday = days[dateobject.getDay()]
    const monthName = month[dateobject.getMonth()]
    const str = weekday + ',' + ' ' + dateobject.getDate() + ' ' +
            monthName + ' ' + dateobject.getFullYear() + ' ' +
            dateobject.getHours() + ':' + dateobject.getMinutes() + ':' +
            dateobject.getSeconds() + ' UTC'
    // console.log(str)
    return str
  }

  // Send Reminder Email at Futre Date Object
  // Uses Mailgun API to send email 24 hours after they were recorded in the Database
  function sendEmailRemind (mturkId, hours_away = 30, study) {
    con.query('SELECT email, remind FROM dot_probe1 WHERE mkturk_id = ?', [mturkId], function (err, result) {
      try {
        sqlresult = JSON.parse(JSON.stringify(result))
        jsondata = sqlresult[0]
        emailaddress = jsondata.email
        remind = jsondata.remind
        // deliverydate = jsondata.time_ready;

        // var currentdate = new Date();
        // var emailaddress = getEmailAddress(mkturk_id, con);
        // var remind = getRemind(mkturk_id, con);

        // Old way of reminding... does seem to format nicely
        // var next24hrdate = getFormattedDate(getFuture24Date(currentdate,hours_away)); // will be delivery 30 hours from current datetime

        const next24hrdate = getFuture24Date(new Date(), hours_away).toUTCString() // will be delivery 30 hours from current datetime

        var mailgun = require('mailgun-js')
        const api_key = 'key-fa2d65c78c52cfabac185c98eb95721e'
        const DOMAIN = 'paulus.touthang.info'
        var mailgun = require('mailgun-js')({ apiKey: api_key, domain: DOMAIN })

        const session2Link = 'http://brainworkout.paulus.libr.net/?session=2&mkturk_id=' + mturkId + '&survey=demo' + '&study=' + study
        const body = 'Hi ' + mturkId + '! \n\nSession 2 of the LIBR brainworkout Amazon Mechanical Turk HIT is ready for you to complete!!!\n\n' + 'Click the link below to complete Session 2!\n\n' + session2Link + '\n\nReminder: You MUST complete session 2 to receive payment for the HIT'

        const data = {
          from: 'James <jtouthang@libr.net>',
          to: emailaddress,
          subject: 'Hello! You can now do session 2 for LIBR brainworkout Amazon Mechanical Turk HIT!',
          text: body,
          html: getRemindHTML(mturkId, study),
          'o:deliverytime': next24hrdate
        }

        if (emailaddress != null && remind == 'YES') {
          console.log('Sending email: ' + emailaddress + '\tID: ' + mturkId)
          mailgun.messages().send(data, function (error, body) {
            console.log(body)
          })
        } else {
          console.log('USER didn\'t give email')
        }
      } catch (err) {
        console.log('Error quering for sending email')
        console.log(err)
      }
    })
  }

  function sendEmailCode (mturkId) {
    con.query('SELECT email, remind FROM dot_probe1 WHERE mkturk_id = ?', [mturkId], function (err, result) {
      try {
        sqlresult = JSON.parse(JSON.stringify(result))
        jsondata = sqlresult[0]
        emailaddress = jsondata.email
        remind = jsondata.remind
        // deliverydate = jsondata.time_ready;

        var mailgun = require('mailgun-js')
        const api_key = 'key-fa2d65c78c52cfabac185c98eb95721e'
        const DOMAIN = 'paulus.touthang.info'
        var mailgun = require('mailgun-js')({ apiKey: api_key, domain: DOMAIN })

        const data = {
          from: 'James <jtouthang@libr.net>',
          to: emailaddress,
          subject: 'Mechanical Turk Survey Code!',
          text: 'Hello!\n\nYour Survey Code is: 11853\n\nFrom all of us at LIBR,\nThank you for your participation.',
          html: getCodeEmailHTML()
        }

        if (emailaddress != null && remind == 'YES') {
          console.log('Sending email: ' + emailaddress + '\tID: ' + mturkId)
          mailgun.messages().send(data, function (error, body) {
            console.log(body)
          })
        } else {
          console.log('USER didn\'t give email')
        }
      } catch (err) {
        console.log('Error quering for sending email')
        console.log(err)
      }
    })
  }

  // Function that adds the record to dp_status table
  function addRecordToStatusTable (id, con) {
    data = {
      mturkId: id
    }
    con.query('INSERT INTO dp_status SET ?', data, function (err, result) {
      if (err) {
        console.log('Error Inserting to dp_status Table')
      } else {
        console.log('Record Inserted to dp_status Table')
      }
    })
  }

  // Inserts new Record into database
  function insertNewData (fields, con, response) {
    console.log('Trying to insert New Data to SQL Database!')
    const currentdate = new Date()
    // var next24hrdate = getFuture24Date(currentdate,24)

    // deleteing white space since some users are mistakenly entereing a space in the ID...
    newMTURKID = fields.mturkId.replace(/\s+/, '')

    data = {
      mturkId: newMTURKID,
      email: fields.email,
      remind: fields.remind,
      time_created: currentdate,
      time_ready: null
    }

    // //console.log(data);

    con.query('INSERT INTO dot_probe1 SET ?', data, function (err, result) {
      if (err) {
        if (err.code == 'ER_DUP_ENTRY') {
          // Duplicate Entry
          // User already has ID on the database
          console.log('Duplicate Entry on dot_probe1 Table')
          // Duplicate so will reroute
          reRoute(con, newMTURKID, response)
        } else {
          console.log(err)
        }
        // console.log(err);
      } else {
        // get the result of the SQL Database
        // 1st Time New User Login
        addRecordToStatusTable(newMTURKID, con)
        response.writeHead(301, {
          Location: '/?study=wave1&session=1' + '&mkturk_id=' + newMTURKID + '&survey=demo'
        })
        response.end()
      }
    })
  }

  // process the fields
  function processForm (req, response) {
    // Store the data from the fields into SQL Database
    const fields = {}
    const form = new formidable.IncomingForm()

    // Puts field info form the form to a JSON object called fields
    form.on('field', function (field, value) {
      // console.log(field + ' = ' + value);
      // console.log(value);
      fields[field] = value
    })

    form.on('end', function () {
      insertNewData(fields, con, response)
    })

    form.parse(req)
  }

  function uploadToCloudinary (file) {
    cloudinary.v2.uploader.upload(file, {
      resource_type: 'auto',
      folder: 'Data',
      use_filename: 'true'
    }, function (error, result) {
      console.log('uploaded..' + file)
      console.log(result)
      console.log(error)
    })
  }

  function sendEmails (mturkId, session, study, advance) {
    if (study == 'wave2') {
      wave2.sendEmails(mturkId, session, study)
      return
    }
    if (study == 'wave3') {
      wave3.sendEmails(mturkId, session, study, advance)
      return
    }

    if (session == '2') {
      console.log('session' + session)
      sendEmailCode(mturkId)
    } else if (session == '1') {
      console.log('session' + session)
      sendEmailRemind(mturkId, hours_away = 30, study = study)
    }

    // Depreciated Code since each function of email reminding and and sending code are both
    // Done in an sql query

    // con.query('SELECT email,remind,time_ready FROM dot_probe1 WHERE mkturk_id = ?',[mkturk_id],function (err, result) {
    // 	try {
    // 		//console.log('sql output is not empty')
    // 		sqlresult = JSON.parse(JSON.stringify(result));
    // 		jsondata = sqlresult[0];
    // 		if (session == '2'){
    // 			console.log('sending code to ' + jsondata.email);
    // 			// If they gave an email addres, than we WILL email them the code
    // 			sendEmailCode(mkturk_id);
    // 			//res.writeHead(301,{Location : '/completed?&mkturk_id=' + mkturk_id});
    // 			//res.end();

    // 		} else if (session == '1'){
    // 			// send Email if the subject gave email and marked the remind checkbox
    // 			sendEmailRemind(mkturk_id, study=study);
    // 			//res.writeHead(301,{Location : '/tooearly?&mkturk_id=' + mkturk_id + '&timeleft=' + jsondata.time_ready });
    // 			//res.end();

    // 		}
    // 	}
    // 	catch (TypeError) {
    // 		// No Email
    // 		// Do Nothing
    // 	}

    // });
  }
}
