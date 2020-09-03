// wave2.js
// This .js file is for all code pertaining to Wave-2 portion of the 
// retest-study
// Wave 2 'study'
// The node js file baceknd file for 
// the chicken task. 

var fs = require('fs');
var url = require('url');
var mysql = require('mysql');
var formidable = require('formidable');
var SqlString = require('sqlstring');
const requestIp = require('request-ip');

// Configuration File for Wave 2 Study
var config = require('./mindreal-config.json')

// Connecting to database
// Each study/wave should have their own database
var con = mysql.createConnection({
	host		: config.mysql_host,
	user		: config.mysql_user,
	password	: config.mysql_password,
	database	: config.mysql_database
});

con.connect(function(err) {
   if (!err)
	   console.log('mindreal db is Connected');
   else
	   console.log('mindreal db connection err.');

});

module.exports = {

	routes : function(app){
		// show index page for Wave-2
		app.get('/mindreal', function (req, res) {
			//var q = url.parse(req.url, true). query;
			//var session = q.session;
			//var mkturk_id = q.mkturk_id;

			fs.readFile('study/mindreal/index.html', function (err, data) {
				// Write Header
				res.writeHead(200, {
					'Content-Type' : 'text/html'
				});
				// Wrte Body
				res.write(data);
				res.end();
			});
		});

		app.get('/mindreal/complete', function (req, res) {
			//var q = url.parse(req.url, true). query;
			//var session = q.session;
			//var mkturk_id = q.mkturk_id;

			fs.readFile('study/mindreal/complete.html', function (err, data) {
				// Write Header
				res.writeHead(200, {
					'Content-Type' : 'text/html'
				});
				// Wrte Body
				res.write(data);
				res.end();
			});
		});
		// process inputs from the wave-2 page
		app.post('/mindrealproceed', function(req, res) {
			processForm(req,res);
		});

		

		// Get the Chicken Task Version given the MTurk id
		app.get('/mindreal/getChickenTaskVersion', function (req, res){
			var q = url.parse(req.url, true).query;
			//console.log('getting version number')
			// var session = q.session;
			var subject = q.subject;
			console.log('Getting the CT Version number for ' + subject)
			var sql = SqlString.format("SELECT task_version FROM mindreal.subjects WHERE subject = ?", [subject]);

			con.query(sql, function(error, result){
				try {
					sqlresult = JSON.parse(JSON.stringify(result));
					jsondata = sqlresult[0]
					//console.log('CT version is : ' + jsondata.task_version.toString());
					
					res.send(jsondata.task_version.toString());

				} catch (err) {
					console.log('error getting task version')
					console.log(error);
				}
			})
		});

		app.get('/mindreal/rating', function(req, res){
			fs.readFile('study/mindreal/rating.html', function (err, data) {
				// Write Header
				res.writeHead(200, {
					'Content-Type' : 'text/html'
				});
				// Wrte Body
				res.write(data);
				res.end();
			});	
		});

	},
	updateStatus : function(mkturk_id, job,session){
		var jobToSqlColumn = {
			'rating_1'	: 'survey_rating_T1',
			'rating_2' 	: 'survey_rating_T2',
			'chicken_1' : 'task_chicken_T1',
			'chicken_2' : 'task_chicken_T2'
		}
	
		colname = jobToSqlColumn[job + '_' + session];
	
		// sql = "INSERT INTO dp_status (mkturk_id, " + colname + ") " +
		// "VALUES (" + mkturk_id + ",\'YES\') " +
		// "ON DUPLICATE KEY UPDATE " + colname + "=\'YES\'";
		sql = SqlString.format("INSERT INTO status (subject, " + colname + " ) " +
		"VALUES ( ? ,\'YES\') " +
		"ON DUPLICATE KEY UPDATE " + colname + "=\'YES\';",[mkturk_id]);
		//console.log(sql);
	
		con.query(sql,function (err, result) {
			// Throws error bcause subject is not in the database/ :)
			try {
				//console.log('sql output is not empty')
				console.log('Updating..' + mkturk_id + ': ' + colname );
				//sendEmailCode(jsondata.email);
			}
			catch (err) {
				console.log('Failed Updating..');
				// Do Nothing
			}
		});
	},
	addTimeReady : function(mkturk_id){
		var currentdate = new Date();
		var next24hrdate = getFuture24Date(currentdate,24) // Date 24 hours from the currentdate object
		//console.log('Updating Time Ready..' + next24hrdate);
		sql = SqlString.format("INSERT INTO subjects (mkturk_id, time_ready) " +
			"VALUES ( ? , \"" + next24hrdate  + "\" ) " + 
			"ON DUPLICATE KEY UPDATE time_ready=\"" + next24hrdate + '\"', [mkturk_id,]);

		console.log(sql);
		con.query(sql, function (err, result) {

			try {
				console.log("Added time_ready for " + mkturk_id + ' at ' + next24hrdate);
				//response.writeHead(301,{Location : '/tooearly?&mkturk_id=' + mkturk_id + '&timeleft=' + next24hrdate });
				//response.end();

			}
			catch (err){
				console.log("Failed Added time Ready..");
				console.log(err);
			}
		});
	},
	sendEmails : function(mkturk_id, session, study) {
		if (session == '2'){
			console.log('sending code to ' + mkturk_id);
			// If they gave an email addres, than we WILL email them the code
			sendEmailCode(mkturk_id);
			//res.writeHead(301,{Location : '/completed?&mkturk_id=' + mkturk_id});
			//res.end();

		} else if (session == '1'){
			// redirect them to the tooearly page
			// send Email if the subject gave email and marked the remind checkbox
			sendEmailRemind(mkturk_id, study=study);
			//res.writeHead(301,{Location : '/tooearly?&mkturk_id=' + mkturk_id + '&timeleft=' + jsondata.time_ready });
			//res.end();

		}

	}

	

}
// process the fields
function processForm(req, response) {
    //Store the data from the fields into SQL Database
    var fields = {};
    var form = new formidable.IncomingForm();

    // Puts field info form the form to a JSON object called fields
    form.on('field', function (field, value) {

        //console.log(field + ' = ' + value);
        //console.log(value);
		fields[field] = value;
		
    });


    form.on('end', function () {
		//response.send(fields);
		insertNewData(fields,response);
		console.log(fields);
    });

	form.parse(req);
	
	return fields
}


function insertNewData(fields, response){
	console.log("Trying to insert New Data to SQL Database!");
	var currentdate = new Date();
	//var next24hrdate = getFuture24Date(currentdate,24)

	// get version number for chicken tas
	// since each subject gets a random chicken task version
	var chicken_version = Math.floor(Math.random() * 3) + 1

	data = {
		subject : fields.subject,
		time_created : currentdate,
		task_version : chicken_version
	}

	console.log(data);
	con.query('INSERT INTO mindreal.subjects SET ?', data, function (err, result) {
		if (err){
			if (err.code == 'ER_DUP_ENTRY'){
				// Duplicate Entry
				// User already has ID on the database
				console.log('Duplicate Entry on mind real subjects Table');
				console.log(err);
				// Duplicate so will reroute

				
				//reRoute(fields,response);
				// No need to Reroute, just show the rating page
				
			
			} else {
				console.log(err);
			}
			//console.log(err);
		
		} else{
			// get the result of the SQL Database
			// 1st Time New User Login
			addRecordToStatusTable(fields.subject);	
			// Redirects to the rating survey			
		}
	});
	response.writeHead(301, {
		Location: '/mindreal/rating/?subsession=pre&study=mindreal&session=' + fields.session + '&subject=' + fields.subject
	});
	response.end();

	
}

// Redirect the user to the same version given the session
function reRoute(fields,response){
	var subject = fields.subject

	console.log('reroute has been summoned :D')
	// THIS function can only be run if user is already in the database
	var sql = SqlString.format("SELECT task_version " +
		'FROM mindreal.subjects ' + 
		"WHERE subjects.subjects = ?", [subject])
	
	console.log(sql);

	//response.redirect('/?mkturk_id=JT&survey=demo&session=1');

	con.query(sql,function (err, result) {

		try {
		  	//console.log('sql output is not empty')
			  sqlresult = JSON.parse(JSON.stringify(result));
			  obj = sqlresult[0];
			  chicken_version = obj.task_version
			  response.writeHead(301, {
				Location: '/mindreal/rating/?subsession=pre&study=mindreal&session=' + fields.session + '&subject=' + fields.subject
				});
				response.end();	
			  

		}
		catch (err) {
			console.log(err);
	  	// Do Nothing
		}
	});
}
// Returns the array of job, name and session
// example: survey_demo_T2

// return [survey, demo, 2]
function parseKey(key){
	job = key.substring(0,key.search("_"));
	name = key.substring(key.search('_') + 1,key.lastIndexOf("_"));
	session = key.substring(key.lastIndexOf('_') + 2,key.lastIndexOf('_') + 3);
	return [job, name, session]
}
// Return True if the subject has past the 24 hour period
function isReady(dateString){
	date = new Date(dateString);

	now = new Date();
	if ( (date.getTime() - now.getTime()) <= 0){
		return true;
	} else {
		return false;
	}
}

// Function that adds the record to dp_status table
function addRecordToStatusTable(id){
	data = {
		subject : id
	}
	con.query('INSERT INTO mindreal.status SET ?', data, function (err, result) {
		if (err) {
			console.log('Error Inserting to status Table');
			console.log(err);
		} else {
			console.log('Record Inserted to status Table')
			console.log(result);
		}
	});
}

// Returns Data object that is 24hours from the passed in DataObject
function getFuture24Date(dateobject,numHours){
	// getTime() gets the time in ms, so we add 8.64E7 which is the number of ms in 24 hours

	// changed later to 30 hours because for some reason, mailgun sends it prematurely
	var dateTime = new Date(dateobject.getTime() + 60 * 60 * numHours * 1000);
	return dateTime
}

function getFormattedDate(dateobject){
	var days = ["Mon", "Tue", "Wed", "Thu","Fri", "Sat", "Sun"];
	var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct", "Nov", "Dec"];
	var weekday = days[dateobject.getDay()];
	var monthName = month[dateobject.getMonth()]
	var str = weekday + ',' + ' ' + dateobject.getDate() + ' ' + 
		monthName + ' ' + dateobject.getFullYear() + ' ' + 
		dateobject.getHours() + ':' + dateobject.getMinutes() + ':' +
		dateobject.getSeconds() + ' UTC';
	//console.log(str)
	return str
}

// Send Reminder Email at Futre Date Object
// Uses Mailgun API to send email 24 hours after they were recorded in the Database
function sendEmailRemind(mkturk_id,hours_away=30, study){
	con.query('SELECT email, remind FROM subjects WHERE mkturk_id = ?',[mkturk_id], function(err, result) {
		try {
			sqlresult = JSON.parse(JSON.stringify(result));
			jsondata = sqlresult[0]
			emailaddress = jsondata.email;
			remind = jsondata.remind;
			//deliverydate = jsondata.time_ready;

			var currentdate = new Date();
			// var emailaddress = getEmailAddress(mkturk_id, con);
			// var remind = getRemind(mkturk_id, con);
			var next24hrdate = getFormattedDate(getFuture24Date(currentdate,hours_away)); // will be delivery 30 hours from current datetime

			var api_key = 'key-fa2d65c78c52cfabac185c98eb95721e';
			var DOMAIN = 'paulus.touthang.info';
			var mailgun = require('mailgun-js')({apiKey: api_key, domain: DOMAIN});

			var session2Link = 'http://brainworkout.paulus.libr.net/?session=2&mkturk_id=' + mkturk_id + '&survey=demo'+ '&study=' + study;
			var body = 'Hi ' + mkturk_id + '! \n\nSession 2 of the LIBR brainworkout Amazon Mechanical Turk HIT is ready for you to complete!!!\n\n' + 'Click the link below to complete Session 2!\n\n'+ session2Link +'\n\nReminder: You MUST complete session 2 to receive payment for the HIT';

			var data = {
			  from: 'James <jtouthang@libr.net>',
			  to: emailaddress,
			  subject: 'Hello! You can now do session 2 for LIBR brainworkout Amazon Mechanical Turk HIT!',
			  text: body,
			  html: getRemindHTML(mkturk_id, study),
			  "o:deliverytime" : next24hrdate
			};

			if (emailaddress != null && remind == 'YES'){
				console.log("Sending email: " + emailaddress + '\tID: ' + mkturk_id);
				mailgun.messages().send(data, function (error, body) {
			  		console.log(body);
				});	
			} else {
				console.log('USER didn\'t give email');
			}

		} catch (err) {
			console.log('Error quering for sending email');
			console.log(err);
		}
	});
}



function sendEmailCode(mkturk_id){

	con.query('SELECT email, remind FROM subjects WHERE mkturk_id = ?',[mkturk_id], function(err, result) {
		try {
			sqlresult = JSON.parse(JSON.stringify(result));
			jsondata = sqlresult[0]
			emailaddress = jsondata.email;
			remind = jsondata.remind;
			//deliverydate = jsondata.time_ready;

			var api_key = 'key-fa2d65c78c52cfabac185c98eb95721e';
			var DOMAIN = 'paulus.touthang.info';
			var mailgun = require('mailgun-js')({apiKey: api_key, domain: DOMAIN});

			var data = {
			  from: 'James <jtouthang@libr.net>',
			  to: emailaddress,
			  subject: 'Mechanical Turk Survey Code!',
			  text: 'Hello!\n\nYour Survey Code is: 11853\n\nFrom all of us at LIBR,\nThank you for your participation.',
			  html : getCodeEmailHTML()
			};

			if (emailaddress != null && remind == 'YES'){
				console.log("Sending email: " + emailaddress + '\tID: ' + mkturk_id);
				mailgun.messages().send(data, function (error, body) {
			  		console.log(body);
				});	
			} else {
				console.log('USER didn\'t give email');
			}

		} catch (err) {
			console.log('Error quering for sending email');
			console.log(err);
		}
	});
}
function getRemindHTML(mkturk_id, study){
	var session2Link = 'http://brainworkout.paulus.libr.net/?session=2&mkturk_id=' + mkturk_id + '&survey=demo' + '&study=' + study;
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
											Hello ${mkturk_id}!
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

function getCodeEmailHTML(){
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