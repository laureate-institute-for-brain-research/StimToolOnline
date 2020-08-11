// API realted function
var fs = require('fs');
var url = require('url');
const { v4: uuidv4 } = require('uuid');

var models = require('./models')

module.exports = function (app){
    // ROUTES
    app.post('/adduser', (req, res) => {
        console.log(req.body)

        req.body.link = uuidv4(); // Create unique uuid for this user/stud/session

        models.dashboard.create(req.body)
            .then(() => {
                console.log('sdf')
                res.send({
                    'message': 'ok'
                })
        })
        
    })

    // use this for verifcation
    app.get('/link', (req, res) => {
        id = req.query.id

        models.dashboard.find({
            where: {
                link: id
            }
        }).then(
            function (link) {
                if (link == null) {
                    res.send('non matced')
                } else {
                    // res.send(link)

                    var json_link = './public/study/' + link.study + '_' + link.session + '.json'
                    console.log(json_link)
                    let session_file = require(json_link);
                    res.redirect(session_file.order[0] + '&id=' + link.link);
                }
            },
            function (err) {
                res.send('non matced')
            }
        )
            .catch(error => {
                console.log(error)
                res.redirect('/');
        });
            
        
    })

}