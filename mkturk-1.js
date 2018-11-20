// Version Test 4 of the MkTurkd Application
// Written by James Touthang



var express = require('express');
var bodyParser = require('body-parser');
var formidable = require('formidable');
var path = require('path');
var fs = require('fs');
var url = require('url');
var mysql = require('mysql');

const requestIp = require('request-ip');
var SqlString = require('sqlstring');
var cloudinary = require('cloudinary');
var serveIndex = require('serve-index');
const Json2csvParser = require('json2csv').Parser;

// Configuration File for this Wave 1 Study
var config = require('./study/wave1/wave1-config.json')

var app = express();

// This is the Module for wave2
var wave2 = require('./study/wave2/wave2');
var wave2route = wave2.routes(app)

// Module for mindReal
var mindreal = require('./study/mindreal/mindreal');
var mindrealroute = mindreal.routes(app)

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
		console.log('wave1 db connection err.');

});


app.use(bodyParser.json());
app.use(express.static('public'));

// Serve the static files
app.use('/data',serveIndex('data',{
	'icons': true,
	'index': true,
	'setHeaders': setHeaders
}));
//app.use(requestIp.mw());
function setHeaders(res, filepath) {
    res.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(filepath));
}


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

	var ctpattern = q.pattern;
	var type = q.type;
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
	} else if(survey == 'panasx'){
		displaySurveyPanasx(res);
	} else if (survey == 'feedback') {
		displayFeedback(res);
	} else if (session == '1' && task == 'dotprobe'){
		displayDotProbe1(res);
	} else if (session == '2' && task == 'dotprobe'){
		displayDotProbe2(res);
	} else if (task == 'chicken'){

		// Route Based on Chicken pattern
		if (type == 'estimate'){

			if (q.pattern){
				displayChickenEstimate(res, q.pattern);
			} else {
				displayChickenEstimate(res, '1');
			}			
		} else{
			switch(ctpattern){
				case '1':
					displayChicken1(res);
					break;
				case '2':
					displayChicken2(res);
					break;
				case '3':
					displayChicken3(res);
					break;
				default:
					displayChicken1(res);
			}
		}

	} else if(task == 'gonogo') {
		displayGoNoGo(res, q.version);
		
	}
	else if (ctpattern == '0' && task == 'chicken'){
		displayChicken0(res);
	} else if (survey == 'datacamp'){
		displayDataCampSurvey(res);
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

app.get('/gonogo', function(req,res){
	var q = url.parse(req.url, true).query;
	//console.log(q.version);
	fileurl  = 'task/gonogo/version_' + q.version.toString() + '/gonogo' + q.version.toString() + '.html'
	fs.readFile(fileurl, function (err, data) {
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
	var month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
	var file_date = d.getFullYear() + "_" + month + "_" + d.getDate() + "_" + d.getHours() + '_' + d.getMinutes()

	outputString = survey + '-' + mkturk_id + '-' + 'T' + session + '-' + file_date + ',\"User Agent: ' + req.headers['user-agent'] +'\",IP: ' + ipaddr + '\n'

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
		outputString = outputString + ques + ',\"' + ans + '\",' + rt + '\n';
	}
	var filename = 'data/' + study + '/surveys/' + study +'-SURVEY-' + survey + '-' + mkturk_id + '-T' + session + '.csv'

	// Don't delete this future james...
	// mindreall needs to keep track of pre-post sessions for the ratings survey
	if (study == 'mindreal'){
		filename = 'data/' + study + '/surveys/' + study +'-SURVEY-' + survey + '-' + mkturk_id + '-T' + session + '-' + q.subsesssion + '.csv'	
	}



	fs.writeFile(filename ,outputString, (err) => {  
	    // throws an error, you could also catch it here
	    if (err) {
			console.log('err');
		}
	    // success case, the file was saved
	    //console.log('File saved!');
		console.log("file saved");

		// Copy the data to a shared folder in root to be accessed by other uses in the VM
		// This is done after writing the file
		fs.copyFile(filename, '/var/node_data/' + filename, (err) => {
			if(err){
				console.log('could not copy');
				//throw err;
			} else {
				console.log('copy complete');
			}
		})
	});
	
	
	//csv.write('surveys/data/' + survey +'-' + mkturk_id + '-T' + session + '.csv', req.body, {header: 'question'});

	// Upload to Cloudinary
	uploadToCloudinary(filename);


	// Update the Status Table in SQL
	updateStatus(mkturk_id, survey,session,con, study);

	var response = {
		status  : 200,
		success : 'Survey Data Saved'
	}

	res.send(JSON.stringify(response))

	
});


// This is the Save Task endppoint for Wave 1 of the test and retest
app.post('/saveDPTask/', function(req, res) {
	var d = new Date();

	var month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
	var file_date = d.getFullYear() + "_" + month + "_" + d.getDate() + "_" + d.getHours() + '_' + d.getMinutes()
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

	// Write to File on current server
	var filename = 'data/' + study + '/tasks/'+ study + '-DP-' + mkturk_id + '-' + 'T' + session + '.csv'
	fs.writeFile(filename, head1 + head2 + content, (err) => {
		if (err) throw err;
		console.log(filename + ' DP saved!');
		// Copy the data to a shared folder in root to be accessed by other uses in the VM
		// This is done after writing the file
		fs.copyFile(filename, '/var/node_data/' + filename, (err) => {
			if(err){
				console.log('could not copy');
				throw err;
			} else {
				console.log('copy complete');
			}
		})

	});

	

	// add Time Ready so that the ready time initiates once Task1 has been completed
	addTimeReady(mkturk_id, study);
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
	sendEmails(mkturk_id, session, study);
	


});

app.post('/saveDC', function(req, res){
	var d = new Date();
	const fields = ['datacamp_1', 'datacamp_2','datacamp_3','datacamp_4'];
	const opts = { fields };
	const transformOpts = { highWaterMark: 16384, encoding: 'utf-8' };

	data = req.body; // json input

	console.log(data)

	//inputJSON = JSON.parse(data);

	var month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
	var file_date = d.getFullYear() + "_" + month + "_" + d.getDate() + "_" + d.getHours() + '_' + d.getMinutes()


	randomNUM = Math.floor(Math.random() * 100000) + 1
	outputPath = 'data/datacamp/dc-' + randomNUM + '.csv'

	 
	//const input = fs.createReadStream(data, { encoding: 'utf8' });
	//const output = fs.createWriteStream(outputPath, { encoding: 'utf8' });
	const json2csvParser = new Json2csvParser({ fields });
	const csv = json2csvParser.parse(data);

	//console.log(csv)

	fs.stat(outputPath, function(err, stat) {
		// file exists, genereate new random number
		while(err == null){
			randomNUM = Math.floor(Math.random() * 100000) + 1
			outputPath = 'data/datacamp/dc-' + randomNUM + '.csv'
		}
		if(err.code == 'ENOENT') {
			// file does not exist
			fs.writeFile(outputPath, 'date:,' + file_date + '\n' + csv, (err) => {
				if (err) throw err;
				console.log(outputPath + ' DC saved!');
		
			});
		} else {
			console.log('Some other error: ', err.code);
		}
	});



	
	res.send('saved DC')

	//const processor = input.pipe(json2csv).pipe(output);

});

// This is wave-2 saveTask endpoint that saves Chicken Task Data
app.post('/saveChickenTask/', function(req, res) {
	var d = new Date();

	var month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers

	var file_date = d.getFullYear() + "_" + month + "_" + d.getDate() + "_" + d.getHours() + '_' + d.getMinutes()
	var q = url.parse(req.url, true).query;
	var session = q.session;
	var study = q.study;
	var mkturk_id = q.mkturk_id;
	var pattern = q.pattern;
	//var survey = q.survey;
	var task = q.task;
	var ipaddr = requestIp.getClientIp(req)
	var type = q.type;

	data = req.body; // json input
	content = data.content;  
	var head1 = "Version," + q.version + "," + "Pattern," + pattern + ",Type," + type + ",Orginal_File_Name,"+ 'CT-' + mkturk_id + '-T' + session + '.csv,'+ 'IP,' + ipaddr + ",Time,"+file_date+ ',chicken_left_x,-75,chicken_left_y,0,chicken_right_x,75,chicken_right_y,0,block1_sigma,33,block1_hazard,0.05,block2_sigma,140,block2_hazard,0.05,block3_sigma,33,block3_hazard,0.2,block4_sigma,140,block4_hazard,0.2,block5_sigma,33,block5_hazard,0.95,block6_sigma,140,block6_hazard,.95' + ",Parameter File,None:FromPsyToolkit" + ',UserAGENT,' + '\"' + req.headers['user-agent'].replace(' ','_') + '\"\n'
    var head2 = "trial_type,trial_number,block_num,egg_x_position,egg_y_position,absolute_time_sec,response_time_sec,response,result,points,left_chicken_x_position,left_chicken_y_position,right_chicken_x_position,right_chicken_y_position,give_feedback\n"

	var filename = 'data/' + study + '/tasks/'+ study + '-CT-' + mkturk_id + '-' + 'T' + session + '.csv'
	fs.writeFile(filename, head1 + head2 + content, (err) => {
		if (err) throw err;
		console.log('Saved Chicken Task Data!');

		// Copy the data to a shared folder in root to be accessed by other uses in the VM
		// This is done after writing the file
		fs.copyFile(filename, '/var/node_data/' + filename, (err) => {
			if(err){
				console.log('could not copy');
				//throw err;
				console.log(err)
			} else {
				console.log('copy complete');
			}
		})

	});
	// add Time Ready so that the ready time initiates once Task1 has been completed
	addTimeReady(mkturk_id, study);

	

	// Run the plot script
	//shell.cd('stats');
	//shell.exec('python makeHTMLplot.py ' + mkturk_id);
	//shell.exec('Rscript makePlot.r ' + mkturk_id);
	//shell.cd('..');

	// Update the Status
	updateStatus(mkturk_id, task,session,con,study);

	// upload to cloudinary
	//uploadToCloudinary(filename);

	// Send Emails
	// // Send the Code by Email if they Include it
	sendEmails(mkturk_id, session, study);


	var response = {
		status  : 200,
		success : 'Chicken Task Data Saved Data Saved'
	}

	res.send(JSON.stringify(response))
});


// Save GoNoGo Task

// Save The input of a file and if its' the same 
// id, study, and session, APPEND it
app.post('/saveGoNoGo', (req,res)=>{
	var q = url.parse(req.url, true).query;

	payload = req.body; // json input
	var ipaddr = requestIp.getClientIp(req)
	var d = new Date()
	var month = d.getMonth() + 1 // on a separate since if we add, it concatenates the numbers
	var file_date = d.getFullYear() + "_" + month + "_" + d.getDate() + "_" + d.getHours() + '_' + d.getMinutes()

	data = payload[0]

	filename  = 'data/wave3/tasks/wave3-GT-' + q.id + '-T' + q.session + '.csv'
	var head1 = "Version:," + q.version + ",Orginal File Name:,"+ 'GT-' + q.id + '-T' + q.session + '.csv'+ ',\"UserAGENT:' + req.headers['user-agent'] + '\",IP: ' + ipaddr + ",Time:,"+file_date+",Parameter File:,None:FromjsPsych\n"
	var head2 = "trial_index,trial_type,trial_number,event,condition,absolute_time_ms,response_time_ms,key_press,outcome,points\n"
	var datarow = data.trial_index + ',' + data.trial_type + ',' + data.trial_number + ',' +
		data.test_part + ',' + data.result + ',' + data.time_elapsed + ',' + 
		data.rt + ',' + data.key_press + ',' + data.outcome + ',' + data.points + '\n'
	// If File Exists, Append the payload
	if (fs.existsSync(filename)){
		fs.appendFile(filename, datarow.replace("null","").replace(undefined, ''), function (err) {
			if (err) throw err;
			console.log('Append GT data!');
			console.log(datarow)
		  });
	} else {
	// Create new File
		fs.writeFile(filename, head1 + head2 + datarow.replace("null","").replace(undefined, ''), (err) => {
			if (err) throw err;
			console.log('New GT File Created');

		});

	}
	// console.log(q);
	// console.log(data.trial_index);
	// console.log(data.trial_type);
	// console.log(data.time_elapsed);
	// console.log(data.internal_node_id);
	res.send('Got the GoNoGo Task Data')

});




// Return Time Life given id
app.get('/getTimeReady', function(req, res) {
	var q = url.parse(req.url, true).query;
	var mkturk_id = q.mkturk_id;
	
	var study = q.study;

	if (study == 'wave2'){
		res.send(wave2.getTimeReady(mkturk_id));
	
	}

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

app.get('/getScores', (req, res)=>{
	var q = url.parse(req.url, true).query;
	var mkturk_id = q.mkturk_id;
	var session = q.session;
	var study = q.study;
	var jsonReturn = {};
	//var filename = 'data/' + study + '/surveys/' + study +'-SURVEY-' + 'panas' + '-' + mkturk_id + '-T' + session + '.csv'

	jsonReturn['PANASX'] = { 
		'T1' : getPANASXScore('data/' + study + '/surveys/' + study +'-SURVEY-' + 'panasx' + '-' + mkturk_id + '-T' + '1' + '.csv'),
		'T2' : getPANASXScore('data/' + study + '/surveys/' + study +'-SURVEY-' + 'panasx' + '-' + mkturk_id + '-T' + '2' + '.csv')
	}

	jsonReturn['ChickenTask'] = { 
		'T1' : getChickenTaskScore('data/' + study + '/tasks/' + study +'-CT-' + mkturk_id + '-T' + '1' + '.csv'),
		'T2' : getChickenTaskScore('data/' + study + '/tasks/' + study +'-CT-' + mkturk_id + '-T' + '2' + '.csv')
	}



	res.send(jsonReturn);
})

// 404 Page
app.get('/*', (req, res)=>{
	res.send('404. We cant find that bro.');
})

function getChickenTaskScore(filename){
	try {
		stringContent = fs.readFileSync(filename).toString();
	  } catch (err) {
		return ({})
	  }
	var contents = toArrayfromCSVString(stringContent);
	returnJSON = {}

	returnJSON['points'] = '0'
	returnJSON['avg_rt'] = 0
	
	for (var i = 2; i < contents.length - 1; i++){
		if (contents[i][1] == "1200"){
			returnJSON['points'] = contents[i][9]
		}

		if (contents[i][0]== 'main'){
			returnJSON['avg_rt'] = returnJSON['avg_rt'] + parseFloat(contents[i][5].replace('\"',''))
		}

		
	}
	returnJSON['avg_rt'] = returnJSON['avg_rt'] / 1200
	return(returnJSON)


}

/**
 * This returns a json object of differente score types from PANAX form.
 * @param {String} filename The Path to the panax output file
 */
function getPANASXScore(filename){
	try {
		stringContent = fs.readFileSync(filename).toString();
	  } catch (err) {
		return ({})
	  }
	var contents = toArrayfromCSVString(stringContent);
	panasx_negaffect_score = [ 'panasx_afraid', 'panasx_scared', 'panasx_nervous', 'panasx_jittery', 'panasx_irritable', 'panasx_hostile', 'panasx_guilty', 'panasx_ashamed', 'panasx_upset', 'panasx_distressed']
	panasx_posaffect_score = ['panasx_active', 'panasx_alert', 'panasx_attentive', 'panasx_determined', 'panasx_enthusiastic', 'panasx_excited', 'panasx_inspired', 'panasx_interested', 'panasx_proud', 'panasx_strong']
	panasx_fear_score = ['panasx_afraid', 'panasx_scared', 'panasx_frightened', 'panasx_nervous', 'panasx_jittery', 'panasx_shaky']
	panasx_hostility_score = ['panasx_angry', 'panasx_hostile', 'panasx_irritable', 'panasx_scornful', 'panasx_disgusted', 'panasx_loathing']
	panasx_guilt_score = ['panasx_guilty', 'panasx_ashamed', 'panasx_blameworthy', 'panasx_angryself', 'panasx_disgustedself', 'panasx_dissatisfiedself']
	panasx_sadness_score = ['panasx_sad', 'panasx_blue', 'panasx_downhearted', 'panasx_alone', 'panasx_lonely']
	panasx_joviality_score = ['panasx_happy', 'panasx_joyful', 'panasx_delighted', 'panasx_cheerful', 'panasx_excited', 'panasx_enthusiastic', 'panasx_lively', 'panasx_energetic']
	panasx_selfassurance_score = ['panasx_proud', 'panasx_strong', 'panasx_confident', 'panasx_bold', 'panasx_daring', 'panasx_fearless']
	panasx_attentiveness_score = ['panasx_alert', 'panasx_attentive', 'panasx_concentrating', 'panasx_determined']
	panasx_shyness_score = ['panasx_shy', 'panasx_bashful', 'panasx_sheepish', 'panasx_timid']
	panasx_fatigue_score = ['panasx_sleepy', 'panasx_tired', 'panasx_sluggish', 'panasx_drowsy']
	panasx_serenity_score = ['panasx_calm', 'panasx_relaxed', 'panasx_atease']
	panasx_surprise_score = ['panasx_amazed', 'panasx_surprised', 'panasx_astonished']
	
	returnJSON = {}
	returnJSON['panasx_negaffect_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_negaffect_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_negaffect_score'] = returnJSON['panasx_negaffect_score'] + value
		}
	}
	returnJSON['panasx_posaffect_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_posaffect_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_posaffect_score'] = returnJSON['panasx_posaffect_score'] + value
		}
	}
	returnJSON['panasx_fear_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_fear_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_fear_score'] = returnJSON['panasx_fear_score'] + value
		}
	}
	returnJSON['panasx_hostility_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_hostility_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_hostility_score'] = returnJSON['panasx_hostility_score'] + value
		}
	}
	returnJSON['panasx_guilt_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_guilt_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_guilt_score'] = returnJSON['panasx_guilt_score'] + value
		}
	}
	returnJSON['panasx_sadness_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_sadness_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_sadness_score'] = returnJSON['panasx_sadness_score'] + value
		}
	}
	returnJSON['panasx_joviality_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_joviality_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_joviality_score'] = returnJSON['panasx_joviality_score'] + value
		}
	}
	returnJSON['panasx_selfassurance_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_selfassurance_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_selfassurance_score'] = returnJSON['panasx_selfassurance_score'] + value
		}
	}
	returnJSON['panasx_attentiveness_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_attentiveness_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_attentiveness_score'] = returnJSON['panasx_attentiveness_score'] + value
		}
	}
	returnJSON['panasx_shyness_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_shyness_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_shyness_score'] = returnJSON['panasx_shyness_score'] + value
		}
	}
	returnJSON['panasx_fatigue_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_fatigue_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_fatigue_score'] = returnJSON['panasx_fatigue_score'] + value
		}
	}
	returnJSON['panasx_serenity_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_serenity_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_serenity_score'] = returnJSON['panasx_serenity_score'] + value
		}
	}
	returnJSON['panasx_surprise_score'] = 0
	for (var i = 2; i < contents.length - 1; i++){
		if (panasx_surprise_score.includes(contents[i][0])){
			//console.log(contents[i][0] + ': ' + contents[i][1] + ': ' + parseInt(contents[i][1].replace('\"','')))
			var value = parseInt(contents[i][1].replace('\"',''))
			returnJSON['panasx_surprise_score'] = returnJSON['panasx_surprise_score'] + value
		}
	}	
	return(returnJSON)

}

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
function displaySurveyPanasx(res){
	fs.readFile('surveys/panasx.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}

function displayFeedback(res){
	fs.readFile('surveys/feedback.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}

function displayDataCampSurvey(res){
	fs.readFile('surveys/datacamp.html', function (err, data) {
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
	fs.readFile('task/chicken_task/predict_version/chicken134.html', function (err, data) {
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
	fs.readFile('task/chicken_task/predict_version/chicken145.html', function (err, data) {
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
	fs.readFile('task/chicken_task/predict_version/chicken4.html', function (err, data) {
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


function displayChickenEstimate(res, version){
	fs.readFile('task/chicken_task/estimate_version/pattern_' + version + '.html', function (err, data) {
		// Write Header
		res.writeHead(200, {
			'Content-Type' : 'text/html'
		});
		// Wrte Body
		res.write(data);
		res.end();
	});	
}


function displayGoNoGo(res, versionnum){
	fs.readFile('task/gonogo/version_' + versionnum + '/container' + versionnum +'.html', function (err, data) {
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

// Add the Time Ready in the SQL Table
function addTimeReady(mkturk_id, study){

	if (study == 'wave2'){
		wave2.addTimeReady(mkturk_id);
		return;
	}

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
	if (study == 'mindreal'){
		mindreal.updateStatus(mkturk_id, job,session)
		return; 

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

			//var currentdate = new Date();
			// var emailaddress = getEmailAddress(mkturk_id, con);
			// var remind = getRemind(mkturk_id, con);

			// Old way of reminding... does seem to format nicely
			//var next24hrdate = getFormattedDate(getFuture24Date(currentdate,hours_away)); // will be delivery 30 hours from current datetime

			
			var next24hrdate = getFuture24Date(new Date(),hours_away).toUTCString() // will be delivery 30 hours from current datetime

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

	//deleteing white space since some users are mistakenly entereing a space in the ID...
	newMTURKID = fields.mkturk_id.replace(/\s+/, "");


	data = {
		mkturk_id : newMTURKID,
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
				reRoute(con, newMTURKID,response);
			} else {
				console.log(err);
			}
			//console.log(err);
		
		} else{
			// get the result of the SQL Database
			// 1st Time New User Login
			addRecordToStatusTable(newMTURKID,con);
			response.writeHead(301, {
				Location: '/?study=wave1&session=1' + '&mkturk_id=' + newMTURKID + '&survey=demo'
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


    form.on('end', function (){
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


function sendEmails(mkturk_id, session, study){

	if (study == "wave2"){
		wave2.sendEmails(mkturk_id, session, study);
		return
	}

	if (session == '2'){
		console.log('session' + session)
		sendEmailCode(mkturk_id);
	} else if( session == '1'){
		console.log('session' + session)
		sendEmailRemind(mkturk_id, hours_away=30,study=study);
	}

	// Depreciated Code since each function of email reminding and and sending code are both 
	// Done in an sql query


	// con.query('SELECT email,remind,time_ready FROM dot_probe1 WHERE mkturk_id = ?',[mkturk_id],function (err, result) {
	// 	try {
	// 		//console.log('sql output is not empty')
	// 		sqlresult = JSON.parse(JSON.stringify(result));
	// 		jsondata = sqlresult[0];
	// 		if (session == '2'){
	// 			console.log('sending code to ' + jsondata.email);
	// 			// If they gave an email addres, than we WILL email them the code
	// 			sendEmailCode(mkturk_id);
	// 			//res.writeHead(301,{Location : '/completed?&mkturk_id=' + mkturk_id});
	// 			//res.end();

	// 		} else if (session == '1'){
	// 			// send Email if the subject gave email and marked the remind checkbox
	// 			sendEmailRemind(mkturk_id, study=study);
	// 			//res.writeHead(301,{Location : '/tooearly?&mkturk_id=' + mkturk_id + '&timeleft=' + jsondata.time_ready });
	// 			//res.end();

	// 		}
	// 	}
	// 	catch (TypeError) {
	// 		// No Email
	// 		// Do Nothing
	// 	}

	// });
}

// Module Exports
module.exports = {
	sendEmailRemind,
	sendEmails
}