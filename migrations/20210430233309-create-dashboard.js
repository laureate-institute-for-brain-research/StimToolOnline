'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('dashboards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      subject: {
        type: Sequelize.STRING
      },
      study: {
        type: Sequelize.STRING
      },
      session: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      link: {
        type: Sequelize.STRING
      },
      remind: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('dashboards');
  }
};