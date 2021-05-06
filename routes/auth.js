var authController = require('../controllers/authcontroller.js')
var authentication = require('../authentication/basic.js')


module.exports = function (app) {

    app.get('/dashboard', authentication, authController.dashboard)

    app.get('/studies', authController.studies)

    app.get('/mturk/driving', authController.mturk_driving)

}
