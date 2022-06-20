
/* eslint-disable camelcase */

// SQL Model for asseed dates. Really used for Follow Up
module.exports = function (sequelize, Sequelize) {
  var dashboard = sequelize.define('dashboard', {
      id: {
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
      },
      subject: {
          type: Sequelize.TEXT
      },
      study: {
          type: Sequelize.TEXT
      },
      session: {
          type: Sequelize.TEXT
      },
      link: {
          type: Sequelize.TEXT
      },
      email: {
        type: Sequelize.TEXT
      },
      phone: {
        type: Sequelize.TEXT
      },
      remind: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      completed: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
      }
  })
  return dashboard
}