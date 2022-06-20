// wave2.js
// This .js file is for all code pertaining to Wave-2 portion of the 
// retest-study
// Wave 2 'study'
// The node js file baceknd file for 
// the chicken task. 

var fs = require('fs');
var url = require('url');
var formidable = require('formidable');
var SqlString = require('sqlstring');
const requestIp = require('request-ip');

// Configuration File for Wave CCC Study
var config = require('./cognitive_control-config.json')

// Import the models
var models = require("./models");


//Sync Database with the models
models.sequelize.sync({force: false}).then(function() {
    console.log('Database Connected for Models');

    
}).catch(function(err) {
    console.log(err, "Error connecting to Database");
});



module.exports = {

	routes : function(app){
		// show index page for Wave-2
		// app.get('/cognitive_control', function (req, res) {
		// 	//var q = url.parse(req.url, true). query;
		// 	//var session = q.session;
		// 	//var mkturk_id = q.mkturk_id;

		// 	fs.readFile('study/cognitive_control/index.html', function (err, data) {
		// 		// Write Header
		// 		res.writeHead(200, {
		// 			'Content-Type' : 'text/html'
		// 		});
		// 		// Wrte Body
		// 		res.write(data);
		// 		res.end();
		// 	});
		// });

		app.get('/cognitive_control/complete', function (req, res) {
			//var q = url.parse(req.url, true). query;
			//var session = q.session;
			//var mkturk_id = q.mkturk_id;

			fs.readFile('study/cognitive_control/complete.html', function (err, data) {
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
		app.post('/cognitive_control_proceed', function(req, res) {
			processForm(req,res);
		});

		// Get Status Table
		app.get('/cognitive_control/getStatus', function(req, res){
			getStatus(req, res)
		})

		

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

	models.status.findOne({
		where : {
			subjectid : fields.subject
		}
	}).then(function(result){
		if(result == undefined || result.lengt == 0){
			// not in status table
			// create one and redirect to flanker task
			models.status.create({
				subjectid : fields.subject
			})
		} else {
			// in subject
			// redirect to the task that hasn't been done
		}
	}).then(()=>{
		// Redirects to the flanker task
		response.writeHead(301, {
			Location: '/flanker?study=cognitive_control&session=' + fields.session + '&subject=' + fields.subject
		});
		response.end();
	})	
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

// Returns the ROW from mysql as JSON
function getStatus(req, res){
	var q = url.parse(req.url, true). query;
	models.status.findOne({
		where : {
			subjectid : q.subject
		}
	}).then((result)=>{
		// return json
		res.send(result)
	})
}






