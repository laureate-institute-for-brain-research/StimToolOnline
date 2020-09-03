
var moment = require('moment')
var pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

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
