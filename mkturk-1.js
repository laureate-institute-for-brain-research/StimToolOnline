// Version Test 4 of the MkTurkd Application
// Written by James Touthang



var express = require('express');
var bodyParser = require('body-parser');
var formidable = require('formidable');
var fs = require('fs');
var url = require('url');
var mysql = require('mysql');

const requestIp = require('request-ip');
var SqlString = require('sqlstring');
var cloudinary = require('cloudinary');

// Configuration File for this Wave 1 Study
var config = require('./study/wave1/wave1-config.json')

var app = express();

// This .js file is for Wave-1
var wave2 = require('./study/wave2/wave2')(app);

// Connecting to database
var con = mysql.createConnection({
     host		: config.mysql_host,
     user		: config.mysql_user,
     password	: config.mysql_password,
     database	: config.mysql_database
});

// Setup the configurations for CDN
cloudinary.config({ 
	cloud_name: config.cloudinary_name, 
	api_key: config.cloudinary_api_key, 
	api_secret:  config.cloudinary_api_secret
});


con.connect(function(err) {
	if (!err)
		console.log('wave1 db is Connected');
	else
		console.log('wave2 db connection err.');

});


app.use(bodyParser.json());
app.use(express.static('public'));
//app.use(requestIp.mw());



// ROUTES
app.get('/',function (req, res) {
	//console.log(req.clientIp);
	// Parse URL

    var q = url.parse(req.url, true).query;
	var session = q.session;
	var mkturk_id = q.mkturk_id;
	var survey = q.survey;
	var task = q.task;
	var study = q.study;
	//console.log('session: ' + session, 'id: ' + mkturk_id, 'survey: ' + survey, 'task: ' + task)
	//console.log(req.connection.remoteAddress)

	if (survey == 'demo'){
		displaySurveydemo(res);
	} else if(survey == 'phq') {
		displaySurveyphq(res);
	} else if (survey == 'oasis') {
		displaySurveyoasis(res);
	} else if (survey == 'asi') {
		displaySurveyasi(res);
	} else if(survey == 'panas'){
		displaySurveyPanas(res);
	} else if (session == '1' && task == 'dotprobe'){
		displayDotProbe1(res);
	} else if (session == '2' && task == 'dotprobe'){
		displayDotProbe2(res);
	} else if (session == '1' && task == 'chicken'){
		displayChicken1(res);
	} else if (session == '2' && task == 'chicken'){
		displayChicken2(res);
	} else if (session == '3' && task == 'chicken'){
		displayChicken3(res);
	} else if (session == '0' && task == 'chicken'){
		displayChicken0(res);
	}

	else if (task == 'test') {
		displayTest(res);
		//sendEmailCode(mkturk_id);
	} else if ((q.name == 'email') && (q.type == 'code')){

		// for some reason.. this doesn't work
		console.log('Test Email Code....');
		sendEmailCode(mkturk_id);
		res.send('Tried to send code email..');


	} else if (q.name == 'email' && q.type == 'remind'){
		sendEmailRemind(mkturk_id,hours_away=1, study);
		res.send('Tried to send remind email');
	} else{
		displayHome(res);
	}
});

// Returning the get request when it has
// not been past 25hours
app.get('/tooearly', function (req, res) {
	var q = url.parse(req.url, true). query;
	var session = q.session;
	var mkturk_id = q.mkturk_id;

	display24HourPage(res);
});

app.get('/completed', function (req, res) {
	var q = url.parse(req.url, true). query;
	var session = q.session;
	var mkturk_id = q.mkturk_id;

	displayCompleted(res);
});


// Page of all Task
app.get('/list', function(req,res){
	fs.readFile('list.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
});

app.get('/workouts', function(req,res){
	fs.readFile('list.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
});

app.get('/test', function(req,res){
	fs.readFile('test.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
});
app.post('/wave1proceed', function (req, res) {

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
	var study = q.study;
	var task = q.task;
	var ipaddr = requestIp.getClientIp(req);;

	json = req.body;
	console.log(json);

	outputString = survey + '-' + mkturk_id + '-' + 'T' + session + '-' + getFormattedDate(d) +',User Agent: ' + req.headers['user-agent'] +',IP: ' + ipaddr + '\n'

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
	var filename = 'data/' + study + '/surveys/' + study +'-SURVEY-' + survey + '-' + mkturk_id + '-T' + session + '.csv'
	fs.writeFile(filename ,outputString, (err) => {  
	    // throws an error, you could also catch it here
	    if (err) throw err;
	    // success case, the file was saved
	    //console.log('File saved!');
	    console.log("file saved");
	});
	
	//csv.write('surveys/data/' + survey +'-' + mkturk_id + '-T' + session + '.csv', req.body, {header: 'question'});
	res.send('');

	res.end('\n');

	// Upload to Cloudinary
	uploadToCloudinary(filename);

	// Update the Status Table in SQL
	updateStatus(mkturk_id, survey,session,con, study);
	
	
});


// This is the Save Task endppoint for Wave 1 of the test and retest
app.post('/saveDPTask/', function(req, res) {
	var d = new Date();

	var file_date = d.getFullYear() + "_" + d.getMonth() + "_" +d.getDay() + "_" + d.getHours() + d.getMinutes()
	var q = url.parse(req.url, true).query;
	var session = q.session;
	var study = q.study;
	var mkturk_id = q.mkturk_id;
	//var survey = q.survey;
	var task = q.task;
	var ipaddr = requestIp.getClientIp(req)

	data = req.body; // json input
	content = data.content;  
	var head1 = "Orginal File Name:,"+ 'DP-' + mkturk_id + '-' + file_date + '.csv'+ ',UserAGENT:' + req.headers['user-agent'] + ',IP: ' + ipaddr + ",Time:,"+file_date+",Parameter File:,None:FromPsyToolkit,Event Codes:,[('INSTRUCT_ONSET', 1), ('TASK_ONSET', 2), ('TRIAL_ONSET', 3), ('CUE_ONSET', 4), ('IMAGE_ONSET', 5), ('TARGET_ONSET', 6), ('RESPONSE', 7), ('ERROR_DELAY', 8), ('BREAK_ONSET', 9), ('BREAK_END', 10)],Trial Types are coded as follows: 8 bits representing [valence neut/neg/pos] [target_orientation H/V] [target_side left/right] [duration .5/1] [valenced_image left/right] [cue_orientation H/V] [cue_side left/right] \n"
    var head2 = "trial_number,trial_type,event_code,absolute_time,response_time,response,result\n"

	var filename = 'data/' + study + '/tasks/' + '/' + study + '-DP-' + mkturk_id + '-' + 'T' + session + '-' + file_date + '.csv'
	fs.writeFile(filename, head1 + head2 + content, (err) => {
		if (err) throw err;
		console.log('File DP saved!');

	});
		// add Time Ready so that the ready time initiates once Task1 has been completed
	addTimeReady(mkturk_id);
	// upload to cloudinary
	uploadToCloudinary(filename);

	res.send('Got the Data')

	// Run the plot script
	//shell.cd('stats');
	//shell.exec('python makeHTMLplot.py ' + mkturk_id);
	//shell.exec('Rscript makePlot.r ' + mkturk_id);
	//shell.cd('..');

	// Update the Status
	updateStatus(mkturk_id, task,session,con,study);	

	// // Send the Code by Email if they Include it
	con.query('SELECT email,remind,time_ready FROM dot_probe1 WHERE mkturk_id = ?',[mkturk_id],function (err, result) {
		try {
			//console.log('sql output is not empty')
			sqlresult = JSON.parse(JSON.stringify(result));
			jsondata = sqlresult[0];
			if (session == '2'){
				console.log('sending code to ' + jsondata.email);
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
		catch (TypeError) {
			// No Email
			// Do Nothing
		}

	});


});

// This is wave-2 saveTask endpoint that saves Chicken Task Data
app.post('/saveChickenTask/', function(req, res) {
	var d = new Date();

	var file_date = d.getFullYear() + "_" + d.getMonth() + "_" +d.getDay() + "_" + d.getHours() + d.getMinutes()
	var q = url.parse(req.url, true).query;
	var session = q.session;
	var study = q.study;
	var mkturk_id = q.mkturk_id;
	//var survey = q.survey;
	var task = q.task;
	var ipaddr = req.connection.remoteAddress;

	data = req.body; // json input
	content = data.content;  
	var head1 = "Orginal File Name:,"+ 'CT-' + mkturk_id + '-' + file_date + '.csv'+ ',UserAGENT:' + req.headers['user-agent'] + ',IP: ' + ipaddr + ",Time:,"+file_date+",Parameter File:,None:FromPsyToolkit\n"
    var head2 = "trial_type,trial_number,block_num,egg_x_position,egg_y_position,absolute_time_sec,response_time_sec,response,result\n"

	var filename = 'data/' + study + '/tasks/CT-' + mkturk_id + '-' + 'T' + session + '-' + file_date + '.csv'
	fs.writeFile(filename, head1 + head2 + content, (err) => {
		if (err) throw err;
		console.log('Saved Chicken Task Data!');

	});
	// add Time Ready so that the ready time initiates once Task1 has been completed
	//addTimeReady(mkturk_id);

	res.send('Got the Chicken Task Data')

	// Run the plot script
	//shell.cd('stats');
	//shell.exec('python makeHTMLplot.py ' + mkturk_id);
	//shell.exec('Rscript makePlot.r ' + mkturk_id);
	//shell.cd('..');

	// Update the Status
	//updateStatus(mkturk_id, task,session,con);

	// upload to cloudinary
	uploadToCloudinary(filename);


	// // Send the Code by Email if they Include it
	con.query('SELECT email,remind,time_ready FROM dot_probe1 WHERE mkturk_id = ?',[mkturk_id],function (err, result) {
		try {
			//console.log('sql output is not empty')
			sqlresult = JSON.parse(JSON.stringify(result));
			jsondata = sqlresult[0];
			if (session == '2'){
				console.log('sending code to ' + jsondata.email);
				// If they gave an email addres, than we WILL email them the code
				sendEmailCode(mkturk_id);
				//res.writeHead(301,{Location : '/completed?&mkturk_id=' + mkturk_id});
				//res.end();

			} else if (session == '1'){
				// redirect them to the tooearly page
					// send Email if the subject gave email and marked the remind checkbox
				sendEmailRemind(mkturk_id);
				//res.writeHead(301,{Location : '/tooearly?&mkturk_id=' + mkturk_id + '&timeleft=' + jsondata.time_ready });
				//res.end();

			}
		}
		catch (TypeError) {
			// No Email
			// Do Nothing
		}

	});


});


// Return Time Life given id
app.get('/getTimeReady', function(req, res) {
	var q = url.parse(req.url, true).query;
	var mkturk_id = q.mkturk_id;

	sql = SqlString.format('SELECT time_ready FROM dot_probe1 WHERE mkturk_id = ?',[mkturk_id]);
	//console.log(sql);
	con.query(sql, function(err, result) {
	try {
			sqlresult = JSON.parse(JSON.stringify(result));
			jsondata = sqlresult[0];
			//console.log(jsondata);
			res.send(jsondata.time_ready);
			//res.end();

	} catch (err) {
		console.log('error getTImeReady Request');
		console.log(err);
	}
	});
})


// Return the phq score of the given mkturk_id
app.get('/getPHQ',function(req, res){
	var q = url.parse(req.url, true).query;
	var mkturk_id = q.mkturk_id;
	var session = q.session;
	var study = q.study;
	var filename = 'data/' + study + '/surveys/' + study +'-SURVEY-' + 'phq' + '-' + mkturk_id + '-T' + session + '.csv'
	res.send(getPHQScore(filename))

})

app.get('/getOASIS', function(req, res) {
	var q = url.parse(req.url, true).query;
	var mkturk_id = q.mkturk_id;
	var session = q.session;
	var study = q.study;
	var filename = 'data/' + study + '/surveys/' + study +'-SURVEY-' + 'oasis' + '-' + mkturk_id + '-T' + session + '.csv'

	// oasis sums up scores the same as phq
	res.send(getPHQScore(filename))
})


// Get the ASI Score,
// Total
// physical
// cognitive
// social
app.get('/getASI', function(req, res) {
	var q = url.parse(req.url, true).query;
	var mkturk_id = q.mkturk_id;
	//var type = q.type;

	var filename = 'surveys/data/SURVEY-asi-' + mkturk_id + '-T2.csv'
	var value = 'not specified';
	switch(q.type){
		case 'total':
			value = getASITotal(filename);
			break;
		case 'physical':
			value = getASIPhysical(filename);
			break;
		case 'cognitive':
			value = getASICognitive(filename);
			break;
		case 'social':
			value = getASISocial(filename);
			break;

	}
	//console.log(value);

	res.send(value)

})

app.get('/getPANAS', function(req, res) {
	var q = url.parse(req.url, true).query;
	var mkturk_id = q.mkturk_id;
	var session = q.session;
	var study = q.study;
	var filename = 'data/' + study + '/surveys/' + study +'-SURVEY-' + 'panas' + '-' + mkturk_id + '-T' + session + '.csv'

	var value = 'not specified';
	switch(q.type){
		case 'positive':
			value = getPANASPositive(filename);
			break;
		case 'negative':
			value = getPANASNegative(filename);
			break;

	}
	//console.log(value);

	res.send(value)

})

function getPANASPositive(filename){
	var stringContent = fs.readFileSync(filename).toString();
	var contents = toArrayfromCSVString(stringContent);
	q_num = [1, 3, 5, 9, 10, 12, 14, 16,17,19];

	// Value should be + 1 more since the suryve has fields like:
	// 0|Very slightly or not at all  
	// 1|A little
	// 2|Moderately
	// 3|Quite a bit
	// 4|Extremely

	// Scoring should be:
	// 1|Very slightly or not at all  
	// 2|A little
	// 3|Moderately
	// 4|Quite a bit
	// 5|Extremely
	var Total = 0;
	for (var i = 2; i < contents.length - 1; i++){
		if (q_num.includes(i - 1)){
			var value = parseInt(contents[i][1]) + 1
			Total = Total + value;

		}
	}
	return Total.toString();
}

function getPANASNegative(filename){
	var stringContent = fs.readFileSync(filename).toString();
	var contents = toArrayfromCSVString(stringContent);
	q_num = [2, 4, 6, 7, 8, 11, 13, 15,18, 20];

	var Total = 0;
	for (var i = 2; i < contents.length - 1; i++){
		if (q_num.includes(i - 1)){
			var value = parseInt(contents[i][1]) + 1
			Total = Total + value;

		}
	}
	return Total.toString();
}

function getASITotal(filename){
	var stringContent = fs.readFileSync(filename).toString();
	var contents = toArrayfromCSVString(stringContent);
	var Total = 0;
	for (var i = 2; i < contents.length - 1; i++){
		value = parseInt(contents[i][1])
		Total = Total + value;
		//console.log(value);
	}
	//console.log(Total)
	return Total.toString();
}

function getASIPhysical(filename){
	var stringContent = fs.readFileSync(filename).toString();
	var contents = toArrayfromCSVString(stringContent);
	q_num = [4,12,8,7,15,3];

	var Total = 0;
	for (var i = 2; i < contents.length - 1; i++){
		if (q_num.includes(i - 1)){
			var value = parseInt(contents[i][1])
			Total = Total + value;

		}
	}

	return Total.toString();


}

function getASICognitive(filename) {
	var stringContent = fs.readFileSync(filename).toString();
	var contents = toArrayfromCSVString(stringContent);
	q_num = [14,18,10,16,2,5];

	var Total = 0;
	for (var i = 2; i < contents.length - 1; i++){
		if (q_num.includes(i - 1)){
			var value = parseInt(contents[i][1])
			Total = Total + value;

		}
	}

	return Total.toString();
}

function getASISocial(filename) {
	var stringContent = fs.readFileSync(filename).toString();
	var contents = toArrayfromCSVString(stringContent);
	q_num = [9,6,11,13,17,1];

	var Total = 0;
	for (var i = 2; i < contents.length - 1; i++){
		if (q_num.includes(i - 1)){
			var value = parseInt(contents[i][1])
			Total = Total + value;

		}
	}

	return Total.toString();


}

// Will return the phq score given the survey filename
function getPHQScore(filename){
	
	var stringContent = fs.readFileSync(filename).toString();
	var contents = toArrayfromCSVString(stringContent);
	
	var Total = 0;
	// skips the first line 
	for (var i = 2; i < contents.length -1; i++){
		question = contents[i][0]
		value = parseInt(contents[i][1])

		Total = Total + value;
		//Total = Total + value
		// if (value != ''){
		// 	Total = Total + parseInt(value)
		// }

	}
	return Total.toString();

}

function toArrayfromCSVString(string){
	var line = string.split('\n');
	var x = new Array(line.length);
	for ( var i = 0; i < line.length; i++){
		x[i] = line[i].split(',')
	}

	return x;
}


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
function displaySurveyPanas(res){
	fs.readFile('surveys/panas.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}
function displayTest(res){

	fs.readFile('task/dotprobe1-5Trial.html', function (err, data) {
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
function displayChicken1(res){
	fs.readFile('task/chicken_task/chicken134.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});		
}
function displayChicken2(res){
	fs.readFile('task/chicken_task/chicken145.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});		
}
function displayChicken3(res){
	fs.readFile('task/chicken_task/chicken4.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});		
}
function displayChicken0(res){
	fs.readFile('task/chicken_task/chicken0.html', function (err, data) {
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
function displayCompleted(res){
	fs.readFile('completed.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}




// SENDHTML CODES
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
							<center><a href="http://www.laureateinstitute.org/"><img class="logo" src="http://brainworkout.paulus.libr.net/images/logo.png"></a></center>
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

// Add the Time Ready in the SQL Table
function addTimeReady(mkturk_id){
	var currentdate = new Date();
	var next24hrdate = getFuture24Date(currentdate,24) // Date 24 hours from the currentdate object
	//console.log('Updating Time Ready..' + next24hrdate);
	sql = SqlString.format("INSERT INTO dot_probe1 (mkturk_id, time_ready) " +
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
}


// Updates the DP_status
// mkturk_id: their Mechanical TURK ID
// job: The survey or the task

function updateStatus(mkturk_id, job,session,con,study){

	if (study == 'wave2'){
		wave2.updateStatus(mkturk_id, job,session)
		return; 
		// exit from the function since we don't want to run the 
		// code snippet below 
	}
	
	var jobToSqlColumn = {
		'demo_1' : 'survey_demo_T1',
		'demo_2' : 'survey_demo_T2',
		'phq_1' : 'survey_phq_T1',
		'phq_2' : 'survey_phq_T2',
		'oasis_1' : 'survey_oasis_T1',
		'oasis_2' : 'survey_oasis_T2',
		'panas_1' : 'survey_panas_T1',
		'panas_2' : 'survey_panas_T2',
		'dotprobe_1' : 'task_dotprobe_T1',
		'dotprobe_2' : 'task_dotprobe_T2'
	}

	colname = jobToSqlColumn[job + '_' + session];


	// sql = "INSERT INTO dp_status (mkturk_id, " + colname + ") " +
	// "VALUES (" + mkturk_id + ",\'YES\') " +
	// "ON DUPLICATE KEY UPDATE " + colname + "=\'YES\'";
	sql = SqlString.format("INSERT INTO dp_status (mkturk_id, " + colname + " ) " +
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
}

// Send the user to the survey or task that they have not completed yet
// This function isn't used at the moment... 
// reroute is done client side
function reRoute(con,mkturk_id,response){

	console.log('reroute has been summoned :D')
	// THIS function can only be run if user is already in the database
	var sql = SqlString.format("SELECT dp_status.survey_demo_T1, " +
		"dp_status.survey_phq_T1," +
		"dp_status.survey_oasis_T1," +
		'dp_status.survey_panas_T1,' +
		'dp_status.task_dotprobe_T1,' +
		'dot_probe1.time_ready,' + 
		'dp_status.survey_demo_T2,' +
		'dp_status.survey_phq_T2,' +
		'dp_status.survey_oasis_T2,' +
		'dp_status.survey_panas_T2,' + 
		'dp_status.task_dotprobe_T2 ' +
		'FROM dp_status ' + 
		"LEFT JOIN dot_probe1 ON dp_status.mkturk_id = dot_probe1.mkturk_id " + 
		"WHERE dot_probe1.mkturk_id = ?", [mkturk_id])
	
	//console.log(sql);

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
					response.writeHead(301,{Location : '/?study=wave1&mkturk_id=' + mkturk_id + '&' + job + '=' + name + '&session=' + session });
					response.end();
		  			break;
		  		} else if (job == 'time' && isReady(val)){
		  			// completed session 1

		  			console.log('did all session 1 and  is ready for session 2');
		  	// 		response.writeHead(301,{Location : '/?&mkturk_id=' + mkturk_id + '&' + job + '=' + name + '&session=' + session });
					// response.end();
					continue;
		  		} else if (job == 'time' && !isReady(val)) {

		  			console.log('did all session 1 and is too early...');
		  			response.writeHead(301,{Location : '/tooearly?study=wave1&mkturk_id=' + mkturk_id + '&timeleft=' + val });
					response.end();
					break;
		  		}else if (job == 'task' && session == '2') {

		  			
		  			console.log('did all session 1 and 2!');
				  	response.writeHead(301,{Location : '/completed?&mkturk_id=' + mkturk_id });
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


// Returns the array of job, name and session
// example: survey_demo_T2

// return [survey, demo, 2]

function parseKey(key){
	job = key.substring(0,key.search("_"));
	name = key.substring(key.search('_') + 1,key.lastIndexOf("_"));
	session = key.substring(key.lastIndexOf('_') + 2,key.lastIndexOf('_') + 3);
	return [job, name, session]
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
	con.query('SELECT email, remind FROM dot_probe1 WHERE mkturk_id = ?',[mkturk_id], function(err, result) {
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

			var mailgun = require("mailgun-js");
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

	con.query('SELECT email, remind FROM dot_probe1 WHERE mkturk_id = ?',[mkturk_id], function(err, result) {
		try {
			sqlresult = JSON.parse(JSON.stringify(result));
			jsondata = sqlresult[0]
			emailaddress = jsondata.email;
			remind = jsondata.remind;
			//deliverydate = jsondata.time_ready;

			var mailgun = require("mailgun-js");
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

// Function that adds the record to dp_status table
function addRecordToStatusTable(id, con){
	data = {
		mkturk_id : id
	}
	con.query('INSERT INTO dp_status SET ?', data, function (err, result) {
		if (err) {
			console.log('Error Inserting to dp_status Table');
		} else {
			console.log('Record Inserted to dp_status Table')
		}
	});
}

// Inserts new Record into database
function insertNewData(fields,con, response){
	console.log("Trying to insert New Data to SQL Database!");
	var currentdate = new Date();
	//var next24hrdate = getFuture24Date(currentdate,24)


	data = {
		mkturk_id : fields.mkturk_id,
		email : fields.email,
		remind : fields.remind,
		time_created : currentdate,
		time_ready : null,
	}

	// //console.log(data);

	con.query('INSERT INTO dot_probe1 SET ?', data, function (err, result) {
		
		if (err){
			if (err.code == 'ER_DUP_ENTRY'){
				// Duplicate Entry
				// User already has ID on the database
				console.log('Duplicate Entry on dot_probe1 Table');
				// Duplicate so will reroute
				reRoute(con, fields.mkturk_id,response);
			} else {
				console.log(err);
			}
			//console.log(err);
		
		} else{
			// get the result of the SQL Database
			// 1st Time New User Login
			addRecordToStatusTable(fields.mkturk_id,con);
			response.writeHead(301, {
				Location: '/?study=wave1&session=1' + '&mkturk_id=' + fields.mkturk_id + '&survey=demo'
			});
			response.end();				
		}
	});
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
    	insertNewData(fields, con,response);
    });

    form.parse(req);
}


/// IGNORE EVERYTHING AFTER HERE
var server = app.listen(config.app_port, function() {
	console.log('listening on port: ' + config.app_port.toString() );
});


function uploadToCloudinary(file){
	cloudinary.v2.uploader.upload(file, {
		resource_type : 'auto',
		folder : 'Data',
		use_filename : 'true',
	},  function(error, result){
		console.log('uploaded..' + file);
		console.log(result);
		console.log(error);

	});
}


// Module Exports
module.exports = {
	sendEmailRemind
}