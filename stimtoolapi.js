// API realted function
var fs = require('fs');
var url = require('url');
const { v4: uuidv4 } = require('uuid');

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
                    if (req.query.index){ index = req.query.index}
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

}