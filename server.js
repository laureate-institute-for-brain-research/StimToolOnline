var http = require('http');
var fs = require('fs');
var formidable = require("formidable");
var util = require('util');
var url = require('url');



var mysql = require('mysql')

var server = http.createServer(function (req, res) {
    //console.log(req.url)

    if (req.method.toLowerCase() == 'get') {

    	var q = url.parse(req.url, true).query;
    	var session = q.session;
    	var mkturk_id = q.mkturk_id;
    	var survey = q.survey;
    	var task = q.task;

	    if (session == '1' && survey == 'demo'){
	    	console.log("Session 1")
	    	console.log(mkturk_id)
	    	displaySurveyDemo(res);
	    }else if(session == '1' && survey == 'oasis'){
	    	displaySurveyOASIS(res);
	    }else if (session == '1' && survey == 'phq') {
	    	// Redirect To phq survey
	    	displaySurveyPHQ(res);

	    }else if(session == '1' && task == 'dotprobe') {
	    	displaydotprobe1(res);
	    }else if (session == '2' && survey == 'demo'){
	    	console.log("Sesison 2!")
	    	displaySurvey(res);
	    } else {
	    	displayForm(res);
	    }
	    // Saveing Survey Data from POST request.
    } else if(req.method.toLowerCase() == 'post' && req.url == '/saveSurvey/'){
    	processSurveyData(req, res);

    } else if (req.method.toLowerCase() == 'post' ) {
        processFormFieldsIndividual(req, res);
    }
});

function processSurveyData(req, res){
	console.log('Got data!')
	console.log(req.url)
}

function displayForm(res) {
    fs.readFile('form.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html'
        });
        res.write(data);
        res.end();
    });
}

function displaySurveyDemo(res) {
    fs.readFile('surveys/demo.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
                'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
}

function displaySurveyPHQ(res) {
    fs.readFile('surveys/phq.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
                'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
}

function displaySurveyOASIS(res){
	fs.readFile('surveys/oasis.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
                'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
}

function displaydotprobe1(res){
	fs.readFile('task/dotprobe1.html', function (err, data) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
                'Content-Length': data.length
        });
        res.write(data);
        res.end();
    });
}



// Returns Data object that is 24hours from the passed in DataObject
function getFuture24Date(dateobject){
	var dateTime = new Date(dateobject.getTime() + 60 * 60 * 24 * 1000);
	return dateTime

}
// Connecting to database
var con = mysql.createConnection({
     host		: "localhost",
     user		: "weblogin",
     password	: "mkturk123",
     database	: "mk_turk1"
});

// function processingmkturkID(jsonsqldata){
// 	//
// 	if (jsonsqldata.length > 0) {
// 		// array not empty, subject is coming back for session 2
// 	} else {
// 		// array empty, subject is new, create new ID and take him to survey
// 	}
// }

function insertNewData(fields){
	console.log("Inserting New Data to Database!")
	var currentdate = new Date();
	var next24hrdate = getFuture24Date(currentdate)


	con.connect(function(err) {
		if (err) throw err;
		console.log('Connected!')

		sqlinsert = "INSERT INTO dot_probe1 (mkturk_id,email,remind,time_created,time_ready) VALUES (" + 
		    '\"' + fields.mturkid + '\",' +
		    '\"' + fields.email + '\",' +
		    '\"' + fields.remind + '\",' +
		    '\"' + currentdate + '\",' +
		    '\"' + next24hrdate + '\");'

		con.query(sqlinsert,function (err, result) {

			if (err) console.log(err);
			// get the result of the SQL Database
			console.log("record Inserted!")

		});
	});


	// If the User kept the checked marked YES, thatn it well send email to remind them when session two is available
	// for them. 
	if (fields.remind == 'YES'){
		// send reminder email
		sendEmail(fields.email, next24hrdate);
	}

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


function processFormFieldsIndividual(req, res) {
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

        sqlGetID = "SELECT mkturk_id FROM dot_probe1 WHERE mkturk_id = \'" + fields.mturkid + "\' LIMIT 1;";


        //console.log(sql)


        // Initial SQL Query
		con.query(sqlGetID,function (err, result) {
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

		  	insertNewData(fields);
		  	//displaySurvey(res)
		  }



        // The output after hitting proceed
        res.writeHead(301, {
            Location: 'http://localhost:1185/?session=' + sessionNumber + '&mkturk_id=' + fields.mturkid + '&survey=demo'
        });
        res.end();


        // res.write('received the data:\n\n');
        // res.end(util.inspect({
        //     post: post
        // }));

        //console.log(post);



		});

    });
    form.parse(req);
}

server.listen(1185);
console.log("server listening on 1185");

