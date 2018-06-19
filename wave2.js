// wave2.js
// This .js file is for all code pertaining to Wave-2 portion of the 
// retest-study
// Wave 2 'study'

var fs = require('fs');
var url = require('url');
var mysql = require('mysql');
var formidable = require('formidable');

var config = require('./config.json')

// Connecting to database
// Each study/wave should have their own database
var con = mysql.createConnection({
	host		: config.mysql_host,
	user		: config.mysql_user,
	password	: config.mysql_password,
	database	: 'wave2'
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
	})

    //other routes..
}


// process the fields
processForm = function (req, response) {
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
		response.send(fields);
		insertNewData(fields, con,response);
		console.log(fields);
    });

	form.parse(req);
	
	return fields
}

// User Procceed logic
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
				Location: '/?session=1' + '&mkturk_id=' + fields.mkturk_id + '&survey=demo'
			});
			response.end();				
		}
	});
}