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

module.exports = function(app){

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
	
    //other routes..
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


function insertNewData(fields,con, response){
	console.log("Trying to insert New Data to SQL Database!");
	var currentdate = new Date();
	//var next24hrdate = getFuture24Date(currentdate,24)

	// get version number for chicken tas
	// since each subject gets a random chicken task version
	var chicken_version = Math.floor(Math.random() * 3) + 1


	data = {
		mkturk_id : fields.mkturk_id,
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
				reRoute(con, fields.mkturk_id,response);
			} else {
				console.log(err);
			}
			//console.log(err);
		
		} else{
			// get the result of the SQL Database
			// 1st Time New User Login
			addRecordToStatusTable(fields.mkturk_id);
			response.writeHead(301, {
				Location: '/?study=wave2&session=1' + '&mkturk_id=' + fields.mkturk_id + '&survey=demo'
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
		"status.survey_phq_T1," +
		"status.survey_oasis_T1," +
		'status.survey_panas_T1,' +
		'status.task_chicken_T1,' +
		'subjects.time_ready,' + 
		'status.survey_demo_T2,' +
		'status.survey_phq_T2,' +
		'status.survey_oasis_T2,' +
		'status.survey_panas_T2,' + 
		'status.task_chicken_T2 ' +
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
					response.writeHead(301,{Location : '/?study=wave2&mkturk_id=' + mkturk_id + '&' + job + '=' + name + '&session=' + session });
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

function updateStatus(mkturk_id, job,session ){
	var jobToSqlColumn = {
		'demo_1' : 'survey_demo_T1',
		'demo_2' : 'survey_demo_T2',
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
}