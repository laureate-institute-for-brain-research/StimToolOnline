// API realted function
var fs = require('fs');
var url = require('url');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jsonexport = require('jsonexport');

var models = require('./models')

module.exports = function (app){
    // ROUTES
    app.post('/adduser', (req, res) => {
        console.log(req.body)

        models.dashboard.find({
            where: req.body
        })
            .then((result) => {
                // console.log(result)
                if (result == null) {
                    req.body.link = uuidv4(); // Create unique uuid for this user/stud/session

                    models.dashboard.create(req.body)
                        .then(() => {
                            res.send({
                                'message': 'ok'
                            })
                    })
                } else {
                    // already have same subject, study, session
                    res.send({
                        'message': 'subject/study/session already exists'
                    })
                }
            })

        
        
    })

    // use this for verifcation
    // Sends them to appropirate link
    app.get('/link', (req, res) => {
        id = req.query.id

        if (req.body.id) {
            id = req.body.id
        }

        models.dashboard.find({
            where: {
                link: id
            }
        })
            .then(
            function (link) {
                if (link == null) {
                    res.redirect('/');
                } else {
                    // res.send(link)
                    index = 0
                    if (req.query.index){ index = parseInt(req.query.index)}
                    var json_link = './public/study/' + link.study + '_' + link.session + '.json'
                    // console.log(json_link)
                    let session_file = require(json_link);
                    res.redirect(session_file.order[index] + '&id=' + link.link + '&index=' + index);
                }
            },
            function (err) {
                res.redirect('/');
            }
        )
            .catch(error => {
                console.log(error)
                res.redirect('/');
        });
    })

    // send dashboard info given link
    app.post('/getInfo', (req, res)=>{
        id = req.body.id

        models.dashboard.find({
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

    // send save info given link
    app.post('/save', (req, res)=>{
        trials_data = req.body.trials_data

        // console.log(trials_data)
        // Save to /data/folder based of study
        jsonexport(trials_data, function(err, csv) {
            if (err) return console.error(err);
            file_name = req.body.expInfo.task + '_' + req.body.expInfo.participant + '_' + req.body.expInfo.session + '_' + req.body.expInfo.date + '.csv'
            // console.log(req.body.expInfo)
            // console.log(file_name)

            path_to_save = `data/${req.body.expInfo.study}/${file_name}`
            fs.access(`data/${req.body.expInfo.study}`, error => {
                if (!error) {
                    // The check succeeded
                    fs.writeFile(path_to_save, csv, function(err) {
                        if (err) return console.error(err);
                        console.log(`${path_to_save} saved`);
                    });
                } else {
                    // The check failed
                    path_to_save = `data/free/${file_name}`
                    fs.writeFile(path_to_save, csv, function(err) {
                        if (err) return console.error(err);
                        console.log(`${path_to_save} saved`);
                    });
                }
            });
          });
    })

}