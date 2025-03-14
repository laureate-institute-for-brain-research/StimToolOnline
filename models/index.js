'use strict'

var fs = require('fs')
var path = require('path')
var Sequelize = require('sequelize')

var opts = {
    host: process.env.mysql_host,
    dialect: 'mysql',
    operatorsAliases: false,
    logging: false,
    force: true,
    alter: true,
    define: {
        freezeTableName: true
    },
    
}

var sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, opts)
var db = {}

// Creating the models in the model(__dirname) folder
fs
    .readdirSync(__dirname)
    .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js')
    })
    .forEach(function (file) {
        // var model = sequelize.import(path.join(__dirname, file))
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)

        db[model.name] = model
    })

Object.keys(db).forEach(function (modelName) {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db)
    }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db