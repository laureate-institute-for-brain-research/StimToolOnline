module.exports = function(sequelize, Sequelize) {
    var Status = sequelize.define('status', {
 
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
 
        subjectid: {
            type: Sequelize.STRING,
            notEmpty: true
        },
 
        flanker_T1: {
            type: Sequelize.STRING,
            notEmpty: true
        },
 
        flanker_T2: {
            type: Sequelize.TEXT
        },
 
        color_stroop_T1: {
            type: Sequelize.TEXT,
        },
        color_stroop_T2: {
            type: Sequelize.TEXT
        },
        emotional_stroop_T1: {
            type: Sequelize.TEXT
        },
        emotional_stroop_T2: {
            type: Sequelize.STRING,
        },
 

    }); 
    return Status;
 
}