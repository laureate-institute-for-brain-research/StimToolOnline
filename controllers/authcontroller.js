
var moment = require('moment')
var pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })
const path = require('path');
const fs = require('fs');

// import Models
var models = require('../models')

exports.dashboard = function (req, res) {
    logger.info('/dashboard called')
    // Dashboard will dispaly data from the users table
    models.dashboard.findAll({
        order: [
            ['createdAt', 'DESC']
        ]
    })
        // Send the Result to Client
        .then(
            function (result) {
            // Sanitize the Data
                var rows = []

                result.forEach(function (element, index) {
                    rows.push({})
                    // console.log(element.getDataValue('subjectid'))
                    rows[index].subject = element.getDataValue('subject')
                    rows[index].study = element.getDataValue('study')
                    rows[index].session = element.getDataValue('session')
                    rows[index].link = element.getDataValue('link')
                    rows[index].completed = element.getDataValue('completed')
                    rows[index].createdAt = moment(element.getDataValue('createdAt')).format('lll')
                    rows[index].updatedAt = moment(element.getDataValue('updatedAt')).format('lll')
                })
                res.render('db', { layout: false, users: rows  })
            }
        )

        .catch((error) => {
        // Sends Nothing if not there
            logger.info(error)
        })
}

exports.studies = function (req, res) {
    const directoryPath = path.join('public', 'study');
    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        //listing all files using forEach

        studies = []
        files.forEach(function (file) {
            // Do whatever you want to do with the file
            // console.log(file);
            if (path.extname(file) == '.json') {
                full_path  = path.join('public', 'study', file)
                // const study_info = require(full_path);
                let rawdata = fs.readFileSync(full_path);
                let study_info = JSON.parse(rawdata);
                // remove last link in the order
                study_info.order.pop()
                studies.push(study_info)
            }
        });
        res.render('studies', { layout: false, studies: studies })

    });
    
}
