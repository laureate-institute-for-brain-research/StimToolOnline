// Online StimTool
// Written by James Touthang

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');

var mysql = require('mysql');

var serveIndex = require('serve-index');

const Json2csvParser = require('json2csv').Parser;

var exphbs = require('express-handlebars')
const expressSanitizer = require('express-sanitizer');

const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })


var config = require('./config/config.json')

var app = express();




// STUDIES//

// This is the Module for wave2
var wave2 = require('./study/wave2/wave2');
var wave2route = wave2.routes(app)

// This is the Module for wave3
var wave3 = require('./study/wave3/wave3');
var wave3route = wave3.routes(app)

// Module for mindReal
var mindreal = require('./study/mindreal/mindreal');
var mindrealroute = mindreal.routes(app)


// Module for Cognitive Control
var cognitive_control = require('./study/cognitive_control/cognitive_control');
var cognitive_control_route = cognitive_control.routes(app)

var models = require('./models')

// Sync Database with the models
models.sequelize.sync({ force: false }).then(function () {
    logger.info('Database Connected for Models')
}).catch(function (err) {
    logger.error(err, 'Error connecting to Database')
})

// Connecting to database
var con = mysql.createConnection({
    host: config.mysql_host,
    user: config.mysql_user,
    password: config.mysql_password,
    database: config.mysql_database
});

// Setup the configurations for CDN
// cloudinary.config({
//     cloud_name: config.cloudinary_name,
//     api_key: config.cloudinary_api_key,
//     api_secret: config.cloudinary_api_secret
// });


con.connect(function(err) {
    if (!err)
        console.log('wave1 db is Connected');
    else
        console.log('wave1 db connection err.');

});


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true,
    parameterLimit: 1000000, // experiment with this parameter and tweak
    limit: '100mb'
}))

app.use(bodyParser.json({
    limit: '100mb',
    extended: true

}));

app.use(expressSanitizer()); // use for sanitizing data

app.use(express.static('public'));

// Serve the static files
app.use('/data', serveIndex('data', {
    'icons': true,
    'index': true,
    'setHeaders': setHeaders
}));
//app.use(requestIp.mw());
function setHeaders(res, filepath) {
    res.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(filepath));
}
// For Handlebars
// Allows for logical coniditions in handlebards
const isEqualHelperHandlerbar = function (a, b, opts) {
    if (a === b) {
        return opts.fn(this)
    } else {
        return opts.inverse(this)
    }
}

app.engine('hbs', exphbs({
    extname: '.hbs',
    defaultLayout: false,
    // handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
        if_equal: isEqualHelperHandlerbar
    }
}))

app.set('view engine', '.hbs')
app.set('views', './views')


var stimToolAPiRoute = require('./stimtoolapi.js')(app)
var authRoute = require('./routes/auth.js')(app)
var apiRoute = require('./api.js')(app)

 /// IGNORE EVERYTHING AFTER HERE
var server = app.listen(config.app_port, function () {
    logger.info('listening on port: ' + config.app_port.toString())
});


// Module Exports
module.exports = app