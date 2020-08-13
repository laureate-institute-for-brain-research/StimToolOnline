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

                    models.dashboard.create(req.sanitize(req.body))
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
        id = req.sanitize(req.query.id);

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
        id = req.sanitize(req.body.id);

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
                    // meaning subject probably entered their own  study -_- or field is blank
                    path_to_save = `data/free/${file_name}`
                    fs.writeFile(path_to_save, csv, function(err) {
                        if (err) return console.error(err);
                        console.log(`${path_to_save} saved`);
                    });
                }
            });
          });
    })

    // send save info given link
    app.post('/share', (req, res)=>{

        // console.log(req.body)
        id = req.sanitize(req.body.id);

        models.dashboard.find({
            where: {
                link: id
            }
        })
            .then(
                function (result) {
                    if (result == null) {
                        res.send({'message': 'not valid id'})
                    } else {
                        var mailgun = require("mailgun-js");
                        var api_key = 'key-fa2d65c78c52cfabac185c98eb95721e';
                        var DOMAIN = 'paulus.touthang.info';
                        var mailgun = require('mailgun-js')({ apiKey: api_key, domain: DOMAIN });
                        
                        var ulink = 'https://brainworkout.paulus.libr.net/link?id=' + id
                        var data = {
                            from: req.sanitize(req.body.from),
                            to: req.sanitize(req.body.to),
                            subject: 'Shared Link',
                            text: `Hello!\n\nA link has been shared to you. Click the link to perform the task: ${ulink}\n\nThank you for your participation.`,
                            html: sharedLinkHTMLTemplate(ulink, req.sanitize(req.body.body)) 
                        };
                        
                        console.log("Sending email: " + req.body.to);
                        // console.log(data)
                        mailgun.messages().send(data, function(error, body) {
                            // console.log(body);
                            res.send({'message': 'email sent!'})
                        });
                        
                        // test
                        // res.send({'message': 'email sent!'})
                    }
                }
        )
        
            .catch(error => {
                console.log(error)
                res.send({'message': 'error sending email'})
            })
        
    })

    function sharedLinkHTMLTemplate(link, body) {
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
                                height: 70px;" src="http://brainworkout.paulus.libr.net/images/logo.png"></a></center>
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