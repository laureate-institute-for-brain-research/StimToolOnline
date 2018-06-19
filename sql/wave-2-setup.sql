-- Create the database
CREATE SCHEMA `new_schema` DEFAULT CHARACTER SET latin1 ;

-- Creating the subjects table
CREATE TABLE `wave2`.`subjects` (
  `pk` INT NOT NULL AUTO_INCREMENT,
  `mkturk_id` VARCHAR(45) NOT NULL,
  `email` VARCHAR(45) NULL,
  `remind` VARCHAR(45) NULL,
  `time_created` VARCHAR(45) NULL,
  `time_ready` VARCHAR(45) NULL,
  `task_version` INT NOT NULL,
  PRIMARY KEY (`pk`));

-- Creating the status table (used to keep track of where subjects are in the study)
CREATE TABLE `wave2`.`status` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `mkturk_id` VARCHAR(45) NULL,
  `task_chicken_T1` VARCHAR(45) NULL,
  `task_chicken_T2` VARCHAR(45) NULL,
  `survey_demo_T1` VARCHAR(45) NULL,
  `survey_demo_T2` VARCHAR(45) NULL,
  `survey_phq_T1` VARCHAR(45) NULL,
  `survey_phq_T2` VARCHAR(45) NULL,
  `survey_oasis_T1` VARCHAR(45) NULL,
  `survey_oasis_T2` VARCHAR(45) NULL,
  `survey_panas_T1` VARCHAR(45) NULL,
  `survey_panas_T2` VARCHAR(45) NULL,
  PRIMARY KEY (`id`));
