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


var app = express();

app.use(bodyParser.json())
app.use(express.static('public'))




// ROUTES




app.get('/',function (req, res) {
	
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
app.get('/24hours', function (req, res) {
	var q = url.parse(req.url, true). query;
	var session = q.session
	var mkturk_id = q.mkturk_id;



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

	json = req.body;
	console.log(json);

	outputString = survey + '-' + mkturk_id + '-' + 'T' + session + '-' + d.toDateString() +',User Agent: ' + req.headers['user-agent'] + '\n'

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

	data = req.body; // json input
	content = data.content;  
	var head1 = "Orginal File Name:,"+ 'DP-' + mkturk_id + '-' + file_date + '.csv'+ ',UserAGENT:' + req.headers['user-agent'] +",Time:,"+file_date+",Parameter File:,None:FromPsyToolkit,Event Codes:,[('INSTRUCT_ONSET', 1), ('TASK_ONSET', 2), ('TRIAL_ONSET', 3), ('CUE_ONSET', 4), ('IMAGE_ONSET', 5), ('TARGET_ONSET', 6), ('RESPONSE', 7), ('ERROR_DELAY', 8), ('BREAK_ONSET', 9), ('BREAK_END', 10)],Trial Types are coded as follows: 8 bits representing [valence neut/neg/pos] [target_orientation H/V] [target_side left/right] [duration .5/1] [valenced_image left/right] [cue_orientation H/V] [cue_side left/right] \n"
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


// Returns Data object that is 24hours from the passed in DataObject
function getFuture24Date(dateobject){
	var dateTime = new Date(dateobject.getTime() + 60 * 60 * 24 * 1000);
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
	var next24hrdate = getFuture24Date(currentdate)


	// sqlinsert = "INSERT INTO dot_probe1 (mkturk_id,email,remind,time_created,time_ready) VALUES (" + 
	// 	    '\"' + fields.mturkid + '\",' +
	// 	    '\"' + fields.email + '\",' +
	// 	    '\"' + fields.remind + '\",' +
	// 	    '\"' + currentdate + '\",' +
	// 	    '\"' + next24hrdate + '\");'

	con.query('INSERT INTO dot_probe1 SET ?', fields, function (err, result) {

		if (err) console.log(err);
		// get the result of the SQL Database
		console.log("record Inserted!")

	});
	// If the User kept the checked marked YES, thatn it well send email to remind them when session two is available
	// for them. 
	if (fields.remind == 'YES'){
		// send reminder email
		sendEmail(fields.email, next24hrdate);
	}

}

function checkTimeReady(id, con){
	//. Session 2

	// var now = new Data();
	// console.log('Checking if it\'s been 24hours');

	// sqlGetID = "SELECT time_ready FROM dot_probe1 WHERE mkturk_id = \'" + id + "\' LIMIT 1;";
	// con.query(sqlGetID,function (err, result) {

	// 	if (err) console.log(err);
	// 	// get the result of the SQL Database
	//   	//jsonsqldata = JSON.stringify(result);

	//   	console.log(result);


	//   	if (result.length == 1) {


	//   	} else {
	//   	// should not happen

	//   	}
	//   }

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


    //console.log('Now: ' + currentdate)
    //console.log('Date in 24hrs: ' + getFuture24Date(currentdate))
    //console.log(post)

    form.on('end', function () {
        //console.log('Form Submitted!!')
        var currentdate = new Date();
	    var next24hrdate = getFuture24Date(currentdate)

	    // JS object of things to Add to database
	    var post = {
	    	mkturk_id : fields.mturkid,
	    	email : fields.email,
	    	remind : fields.remind,
	    	time_created : currentdate,
	    	time_ready : next24hrdate
	    }

	    var sessionNumber = 1;
	    con.connect(function(err) {
        	if (!err)
        		console.log('Database is Connected');
        	else
        		console.log('DB connection err.');

        });


        //console.log(sql)

        // Initial SQL Query
		con.query('SELECT mkturk_id FROM dot_probe1 WHERE mkturk_id = ?',[fields.mturkid],function (err, result) {
		  if (err) console.log(err);
		  // get the result of the SQL Database
		  jsonsqldata = JSON.stringify(result);
		  console.log(result.length);

		  // If SQL QUERY has 1 length, than ID is already in Database
		  // IF not, it will be added and sent to
		  if (result.length == 1) {
		  	// old user take them to sesison 2
		  	console.log('sql output is not empty')
		  	sessionNumber = 2;
		  	//console.log(jsonsqldata)
		  } else {
		  	// empty, insert to database
		  	console.log('sql empty.');
		  	//console.log(jsonsqldata);
		  	//console.log(fields);

		  	insertNewData(fields, con);
		  	//displaySurvey(res)
		  }

		 // The output after hitting proceed 

		if (sessionNumber == 2) {

			checkTimeReady(fields.mkturk_id, con);

		} else {
			
        	res.writeHead(301, {
            	Location: '/?session=' + sessionNumber + '&mkturk_id=' + fields.mturkid + '&survey=demo'
        	});

        	res.end();

		}
        // res.write('received the data:\n\n');
        // res.end(util.inspect({
        //     post: post
        // }));

        //console.log(post);

		});

    });
    form.parse(req);
}


var server = app.listen(1185, function() {
	console.log('listening on port: ', server.address().port);
})