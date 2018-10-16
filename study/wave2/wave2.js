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

// Configuration File for Wave 2 Study
var config = require('./wave2-config.json')

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
	   console.log('wave2 db is Connected');
   else
	   console.log('wave2 db connection err.');

});

module.exports = {

	routes : function(app){
		// show index page for Wave-2
		app.get('/wave2', function (req, res) {
			//var q = url.parse(req.url, true). query;
			//var session = q.session;
			//var mkturk_id = q.mkturk_id;

			fs.readFile('index-wave-2.html', function (err, data) {
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
		app.post('/wave2proceed', function(req, res) {
			processForm(req,res);
		});

		// Get the Chicken Task Version given the MTurk id
		app.get('/getChickenTaskVersion', function (req, res){
			var q = url.parse(req.url, true).query;
			//console.log('getting version number')
			// var session = q.session;
			var mkturk_id = q.mkturk_id;
			console.log('Getting the CT Version number for ' + mkturk_id)
			var sql = SqlString.format("SELECT task_version FROM wave2.subjects WHERE mkturk_id = ?", [mkturk_id]);

			con.query(sql, function(error, result){
				try {
					sqlresult = JSON.parse(JSON.stringify(result));
					jsondata = sqlresult[0]
					//console.log(jsondata.task_version);

					res.send(jsondata.task_version.toString());
				} catch (err) {
					console.log('error getting task version')
					console.log(error);
				}
			})
		});

		app.get('/getTimeReadyWave2', function(req, res){
			var q = url.parse(req.url, true).query;
			var mkturk_id = q.mkturk_id;
			sql = SqlString.format('SELECT time_ready FROM wave2.subjects WHERE mkturk_id = ?',[mkturk_id]);
			//console.log(sql);
			con.query(sql, function(err, result) {
				//console.log(result);
				try {
						sqlresult = JSON.parse(JSON.stringify(result));
						jsondata = sqlresult[0];
						//console.log(jsondata);
						res.send(jsondata.time_ready)
						//return (jsondata.time_ready);
						//res.end();
		
				} catch (err) {
					console.log('error timeReady wave 2 Request');
					console.log(err);
				}
			});
		})

	},
	updateStatus : function(mkturk_id, job,session){
		var jobToSqlColumn = {
			'demo_1' : 'survey_demo_T1',
			'demo_2' : 'survey_demo_T2',
			'panasx_1' : 'survey_panasx_T1',
			'panasx_2' : 'survey_panasx_T2',
			'phq_1' : 'survey_phq_T1',
			'phq_2' : 'survey_phq_T2',
			'oasis_1' : 'survey_oasis_T1',
			'oasis_2' : 'survey_oasis_T2',
			'panas_1' : 'survey_panas_T1',
			'panas_2' : 'survey_panas_T2',
			'chicken_1' : 'task_chicken_T1',
			'chicken_2' : 'task_chicken_T2'
		}
	
		colname = jobToSqlColumn[job + '_' + session];
	
		// sql = "INSERT INTO dp_status (mkturk_id, " + colname + ") " +
		// "VALUES (" + mkturk_id + ",\'YES\') " +
		// "ON DUPLICATE KEY UPDATE " + colname + "=\'YES\'";
		sql = SqlString.format("INSERT INTO status (mkturk_id, " + colname + " ) " +
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
		insertNewData(fields, con,response);
		console.log(fields);
    });

	form.parse(req);
	
	return fields
}

/**
 * Returns equal 25 % probability for each of the 4 patterns
 */
function getRandomEqualProbabily(){
	var num = Math.random();
	if(num < 0.25) return 1;
	else if (num < .5) return 2;
	else if (num < .75) return 3;
	else return 4;
}

function insertNewData(fields,con, response){
	console.log("Trying to insert New Data to SQL Database!");
	var currentdate = new Date();
	//var next24hrdate = getFuture24Date(currentdate,24)

	// get version number for chicken tas
	// since each subject gets a random chicken task version

	// Check the subjects table and see how much versions are already there.
	//var chicken_version = Math.floor(Math.random() * 3) + 1

	// Modifed after 10/16/2018
	// There is a 25% probabily for each of the 4 patterns so
	// the 4 patterns should counter balance
	var chicken_version = getRandomEqualProbabily()

	newMTURKID = fields.mkturk_id.replace(/\s+/, "");


	data = {
		mkturk_id : newMTURKID,
		email : fields.email,
		remind : fields.remind,
		time_created : currentdate,
		time_ready : null,
		task_version : chicken_version
	}

	// //console.log(data);

	con.query('INSERT INTO subjects SET ?', data, function (err, result) {
		if (err){
			if (err.code == 'ER_DUP_ENTRY'){
				// Duplicate Entry
				// User already has ID on the database
				console.log('Duplicate Entry on subjects Table');
				// Duplicate so will reroute
				reRoute(con, newMTURKID,response);
			} else {
				console.log(err);
			}
			//console.log(err);
		
		} else{
			// get the result of the SQL Database
			// 1st Time New User Login
			addRecordToStatusTable(newMTURKID);
			response.writeHead(301, {
				Location: '/?study=wave2&session=1' + '&mkturk_id=' + newMTURKID + '&survey=demo'
			});
			response.end();				
		}
	});
}

// Send the user to the survey or task that they have not completed yet
// This function isn't used at the moment... 
// reroute is done client side
function reRoute(con,mkturk_id,response){

	console.log('reroute has been summoned :D')
	// THIS function can only be run if user is already in the database
	var sql = SqlString.format("SELECT status.survey_demo_T1, " +
		"status.survey_panasx_T1," +
		'status.task_chicken_T1,' +
		'subjects.time_ready,' + 
		'status.survey_demo_T2,' +
		'status.survey_panasx_T2,' +
		'status.task_chicken_T2, ' +
		'subjects.task_version ' + 
		'FROM status ' + 
		"LEFT JOIN subjects ON status.mkturk_id = subjects.mkturk_id " + 
		"WHERE subjects.mkturk_id = ?", [mkturk_id])
	
	console.log(sql);

	//response.redirect('/?mkturk_id=JT&survey=demo&session=1');

	con.query(sql,function (err, result) {

		try {
		  	//console.log('sql output is not empty')
		  	sqlresult = JSON.parse(JSON.stringify(result));
		  	obj = sqlresult[0];

		  	lastYesKey = '';
		  	lastJob = '';
		  	lastName = ''
		  	lastSession = '';
		  	value = '';
		  	timeReady = '';

		  	// get the key with the last 'YES' status and the time_ready value
		  	console.log(obj);
		  	for (var key in obj){

		  		var val = obj[key];
		  		//console.log('key: ' + key + ',' + obj[key]);

		  		// Parse the keys

		  		jobs = parseKey(key);
		  		var job = jobs[0];
		  		var name = jobs[1];
				var session = jobs[2];
				chicken_version = obj['task_version']
				
				
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

		  		//console.log('job: ' + job + '\tname: ' + name + '\tsession: ' + session + '\tvalue: ' + val);
		  		//console.log(mkturk_id + ':' + job + ':' + name + ':' + val);
		  		if (val == null) {

		  			console.log('redirect..');
		  			//response.redirect('/?&mkturk_id=' + mkturk_id + '&' + job + '=' + 'asi' + '&session=' + session)
					// this.statusCode = 302;
					
					// If the job is a task, then redirect to their chicken version number
					if (job == 'task'){
						response.writeHead(301,{Location : '/?study=wave2&mkturk_id=' + mkturk_id + '&' + job + '=' + name + '&session=' + session + '&version=' + chicken_version + '&type=estimate' });
						response.end();
					}

					response.writeHead(301,{Location : '/?study=wave2&mkturk_id=' + mkturk_id + '&' + job + '=' + name + '&session=' + session });
					response.end();
		  			break;
		  		} else if (job == 'time' && isReady(val)){
		  			// completed session 1

		  			console.log('did all session 1 and  is ready for session 2');

		  			// response.writeHead(301,{Location : '/?&mkturk_id=' + mkturk_id + '&' + job + '=' + name + '&session=' + session });
					// response.end();
					continue;
		  		} else if (job == 'time' && !isReady(val)) {

		  			console.log('did all session 1 and is too early...');
		  			response.writeHead(301,{Location : '/tooearly?study=wave2&mkturk_id=' + mkturk_id + '&timeleft=' + val });
					response.end();
					break;
		  		}else if (job == 'task' && session == '2') {

		  			console.log('did all session 1 and 2!');
				  	response.writeHead(301,{Location : '/completed?study=wave2&mkturk_id=' + mkturk_id });
					response.end();
					break;
		  		} else {
		  			// value is not null,
		  			// Already did this so skip to the next  key
		  			continue;
		  		}
		  		//console.log('job: ' + job + '\tname: ' + name + '\tsession: ' + session + '\tvalue: ' + val);

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
		mkturk_id : id
	}
	con.query('INSERT INTO status SET ?', data, function (err, result) {
		if (err) {
			console.log('Error Inserting to status Table');
		} else {
			console.log('Record Inserted to status Table')
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