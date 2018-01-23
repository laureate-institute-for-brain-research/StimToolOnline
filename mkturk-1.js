// Version Test 4 of the MkTurkd Application
// Written by James Touthang


var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var formidable = require('formidable');
var util = require('util');
var fs = require('fs');
var url = require('url');
var mysql = require('mysql');
var csv = require('csvdata')
var converter = require('json-2-csv');
const requestIp = require('request-ip');


var app = express();

app.use(bodyParser.json())
app.use(express.static('public'))
app.use(requestIp.mw())




// ROUTES




app.get('/',function (req, res) {
	//console.log(req.clientIp);
	// Parse URL

    var q = url.parse(req.url, true).query;
	var session = q.session;
	var mkturk_id = q.mkturk_id;
	var survey = q.survey;
	var task = q.task;
	console.log('session: ' + session, 'id: ' + mkturk_id, 'survey: ' + survey, 'task: ' + task)

	if (survey == 'demo'){
		displaySurveydemo(res);
	} else if(survey == 'phq') {
		displaySurveyphq(res);
	} else if (survey == 'oasis') {
		displaySurveyoasis(res);
	} else if (survey == 'asi') {
		displaySurveyasi(res);
	} else if (session == '1' && task == 'dotprobe'){
		displayDotProbe1(res);
	} else if (session == '2' && task == 'dotprobe'){
		displayDotProbe2(res);

	}else{
		displayHome(res);
	}
});

// Returning the get request when it has
// not been past 25hours
app.get('/tooearly', function (req, res) {
	var q = url.parse(req.url, true). query;
	var session = q.session
	var mkturk_id = q.mkturk_id;

	display24HourPage(res);



});

app.post('/', function (req, res) {

	var q = url.parse(req.url, true).query;
	var session = q.session;
	var mkturk_id = q.mkturk_id;
	var survey = q.survey;
	var task = q.task;

	processForm(req, res);
});

// POST SURVEY DATA
app.post('/saveSurvey/', function(req, res) {
	var d = new Date();
	var q = url.parse(req.url, true).query;
	var session = q.session;
	var mkturk_id = q.mkturk_id;
	var survey = q.survey;
	var task = q.task;
	var ipaddr = req.clientIp;

	json = req.body;
	console.log(json);

	outputString = survey + '-' + mkturk_id + '-' + 'T' + session + '-' + d.toDateString() +',User Agent: ' + req.headers['user-agent'] +',IP: ' + ipaddr + '\n'

	outputString = outputString + 'QUESTION,RESULT,RT(ms)\n';

	//var file = new File('surveys/data/SURVEY-' + survey +'-' + mkturk_id + '-T' + session + '.csv')

	// Iterage over the JSON Data
	var ques = '';
	var rt = '';
	var ans = '';

	for (key in json){
		// Check if TRQ

		if (/TRQ/.test(key)){
			rt = json[key];
			continue; // goes to next iteration
		} else {
			ques = key;
			ans = json[key];
		}
		outputString = outputString + ques + ',' + ans + ',' + rt + '\n';
	}
	fs.writeFile('surveys/data/SURVEY-' + survey +'-' + mkturk_id + '-T' + session + '.csv',outputString, (err) => {  
	    // throws an error, you could also catch it here
	    if (err) throw err;
	    // success case, the file was saved
	    //console.log('File saved!');
	    console.log("file saved")
	});	

	//csv.write('surveys/data/' + survey +'-' + mkturk_id + '-T' + session + '.csv', req.body, {header: 'question'});
	res.send('');
	res.end('\n');

});

app.post('/saveTask/', function(req, res) {
	var d = new Date();

	var file_date = d.getFullYear() + "_" + d.getMonth() + "_" +d.getDay() + "_" + d.getHours() + d.getMinutes()
	var q = url.parse(req.url, true).query;
	var session = q.session;
	var mkturk_id = q.mkturk_id;
	var survey = q.survey;
	var task = q.task;
	var ipaddr = req.clientIp;

	data = req.body; // json input
	content = data.content;  
	var head1 = "Orginal File Name:,"+ 'DP-' + mkturk_id + '-' + file_date + '.csv'+ ',UserAGENT:' + req.headers['user-agent'] + ',IP: ' + ipaddr + ",Time:,"+file_date+",Parameter File:,None:FromPsyToolkit,Event Codes:,[('INSTRUCT_ONSET', 1), ('TASK_ONSET', 2), ('TRIAL_ONSET', 3), ('CUE_ONSET', 4), ('IMAGE_ONSET', 5), ('TARGET_ONSET', 6), ('RESPONSE', 7), ('ERROR_DELAY', 8), ('BREAK_ONSET', 9), ('BREAK_END', 10)],Trial Types are coded as follows: 8 bits representing [valence neut/neg/pos] [target_orientation H/V] [target_side left/right] [duration .5/1] [valenced_image left/right] [cue_orientation H/V] [cue_side left/right] \n"
    var head2 = "trial_number,trial_type,event_code,absolute_time,response_time,response,result\n"

	fs.writeFile('task/data/DP-' + mkturk_id + '-' + 'T' + session + '-' + file_date + '.csv', head1 + head2 + content, (err) => {
		if (err) throw err;
		console.log('File DP saved!');

	});

	res.send('Got the data!\n');


});






// 			Output Pages 		//

function displayHome(res) {
	fs.readFile('index.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});
}

function displaySurveydemo(res){
	fs.readFile('surveys/demo.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}

function displaySurveyphq(res){
	fs.readFile('surveys/phq.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}

function displaySurveyoasis(res){
	fs.readFile('surveys/oasis.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}

function displaySurveyasi(res){
	fs.readFile('surveys/asi.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}

function displayDotProbe1(res){
	fs.readFile('task/dotprobe1.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}

function displayDotProbe2(res){
	fs.readFile('task/dotprobe2.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}

function display24HourPage(res){
	fs.readFile('tooearly.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
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
function sendEmail(emailaddress, futuredate){
	var mailgun = require("mailgun-js");
	var api_key = 'key-fa2d65c78c52cfabac185c98eb95721e';
	var DOMAIN = 'paulus.touthang.info';
	var mailgun = require('mailgun-js')({apiKey: api_key, domain: DOMAIN});

	var data = {
	  from: 'James <jtouthang@libr.net>',
	  to: emailaddress,
	  subject: 'Mechanical Turk: Session 2 Ready!!',
	  text: 'Hello! You can now do session 2',
	  "o:deliverytime" : getFormattedDate(futuredate)
	};

	mailgun.messages().send(data, function (error, body) {
	  console.log(body);
	});
}

function insertNewData(fields,con){
	console.log("Inserting New Data to Database!")
	var currentdate = new Date();
	var next24hrdate = getFuture24Date(currentdate,24)

	data = {
		mkturk_id : fields.mkturk_id,
		email : fields.email,
		remind : fields.remind,
		time_created : currentdate,
		time_ready : next24hrdate

	}


	// sqlinsert = "INSERT INTO dot_probe1 (mkturk_id,email,remind,time_created,time_ready) VALUES (" + 
	// 	    '\"' + fields.mturkid + '\",' +
	// 	    '\"' + fields.email + '\",' +
	// 	    '\"' + fields.remind + '\",' +
	// 	    '\"' + currentdate + '\",' +
	// 	    '\"' + next24hrdate + '\");'

	con.query('INSERT INTO dot_probe1 SET ?', data, function (err, result) {

		if (err) console.log(err);
		// get the result of the SQL Database
		console.log("record Inserted!")

	});
	// If the User kept the checked marked YES, thatn it well send email to remind them when session two is available
	// for them. 
	if (fields.remind == 'YES' && fields.mkturk_id != ''){
		// send reminder email
		sendEmail(fields.email, getFuture24Date(currentdate,30));
	}

}


// Connecting to database
var con = mysql.createConnection({
     host		: "localhost",
     user		: "weblogin",
     password	: "U5AZwEpM",
     database	: "mk_turk1"
});

function processForm(req, res) {
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

	    var sessionNumber = 1;
	    con.connect(function(err) {
        	if (!err)
        		console.log('Database is Connected');
        	else
        		console.log('DB connection err.');

        });


        //console.log(sql)

        // Initial SQL Query checks the database if the subjece is not already on there
		con.query('SELECT time_ready FROM dot_probe1 WHERE mkturk_id = ?',[fields.mkturk_id],function (err, result) {
		  
		  // Throws error bcause subject is not in the database/ :)

		  try {
		  	//console.log('sql output is not empty')
		  	sqlresult = JSON.parse(JSON.stringify(result));
		  	jsondata = sqlresult[0]
		  	console.log(jsondata.time_ready);

		  	res.writeHead(301, {
            	Location: '/tooearly?mkturk_id=' + fields.mkturk_id + '&timeleft=' + jsondata.time_ready
        	});

        	res.end();
		  }
		  catch (TypeError) {

		  	insertNewData(fields, con);
		  	//displaySurvey(res)

		  	res.writeHead(301, {
            	Location: '/?session=1' + '&mkturk_id=' + fields.mkturk_id + '&survey=demo'
        	});

        	res.end();
		  }

		});

    });
    form.parse(req);
}


var server = app.listen(1185, function() {
	console.log('listening on port: ', server.address().port);
})