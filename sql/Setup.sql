
# Script to setup the database

CREATE TABLE `dot_probe1` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mkturk_id` varchar(45) DEFAULT NULL,
  `email` varchar(45) DEFAULT NULL,
  `remind` varchar(45) DEFAULT NULL,
  `time_created` varchar(45) DEFAULT NULL,
  `time_ready` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mid_uniq_table` (`mkturk_id`)
);

# Creating the Status Table
CREATE TABLE `mk_turk1`.`dp_status` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `mkturk_id` VARCHAR(45) NULL,
  `dp_task_T1` VARCHAR(45) NULL,
  `dp_task_T2` VARCHAR(45) NULL,
  `survey_demo_T1` VARCHAR(45) NULL,
  `survey_demo_T2` VARCHAR(45) NULL,
  `survey_phq_T1` VARCHAR(45) NULL,
  `survey_phq_T2` VARCHAR(45) NULL,
  `survey_oasis_T1` VARCHAR(45) NULL,
  `survey_oasis_T2` VARCHAR(45) NULL,
  `survey_asi_T1` VARCHAR(45) NULL,
  `survey_asi_T2` VARCHAR(45) NULL,
  PRIMARY KEY (`id`)
  );

# ADD CONSTRAINTS FOR UNIQUE Column
ALTER TABLE dp_status ADD CONSTRAINT mid_table UNIQUE (mkturk_id);
ALTER TABLE dot_probe1 ADD CONSTRAINT mid_uniq_table UNIQUE (mkturk_id);

