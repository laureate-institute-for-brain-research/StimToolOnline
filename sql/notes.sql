
CREATE TABLE `dp_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mkturk_id` varchar(45) DEFAULT NULL,
  `task_dotprobe_T1` varchar(45) DEFAULT NULL,
  `task_dotprobe_T2` varchar(45) DEFAULT NULL,
  `survey_demo_T1` varchar(45) DEFAULT NULL,
  `survey_demo_T2` varchar(45) DEFAULT NULL,
  `survey_phq_T1` varchar(45) DEFAULT NULL,
  `survey_phq_T2` varchar(45) DEFAULT NULL,
  `survey_oasis_T1` varchar(45) DEFAULT NULL,
  `survey_oasis_T2` varchar(45) DEFAULT NULL,
  `survey_asi_T1` varchar(45) DEFAULT NULL,
  `survey_asi_T2` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mid_table` (`mkturk_id`)
);

# Query to create status table
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


INSERT INTO dp_status (mkturk_id, survey_oasis ) VALUES ( 'TEST1' ,'YES') ON DUPLICATE KEY UPDATE survey_oasis='YES';


UPDATE dp_status SET `survey_asi`='YES' WHERE `mkturk_id`='TEST2';


# INSERT AND UPDATE time_ready
INSERT INTO dot_probe1 (mkturk_id,time_ready)
VALUES ('JAMESTEST1','now')
ON DUPLICATE KEY UPDATE time_ready='now';



# 
SELECT dp_status.survey_demo_T1, dp_status.survey_phq_T1,dp_status.survey_oasis_T1,dp_status.survey_asi_T1, dp_status.dp_task_T1dot_probe1.time_ready,dp_status.survey_demo_T2,dp_status.survey_phq_T2,dp_status.survey_oasis_T2,dp_status.survey_asi_T2,dp_status.dp_task_T2 FROM dp_status LEFT JOIN dot_probe1 ON dp_status.mkturk_id = dot_probe1.mkturk_id WHERE dot_probe1.mkturk_id = 'JT9';

# Joining Tables in SQL
SELECT dp_status.survey_demo_T1,
dp_status.survey_phq_T1,
dp_status.survey_oasis_T1,
dp_status.survey_asi_T1,
dp_status.dp_task_T1,
dot_probe1.time_ready,
dp_status.survey_demo_T2,
dp_status.survey_phq_T2,
dp_status.survey_oasis_T2,
dp_status.survey_asi_T2,
dp_status.dp_task_T2 
FROM dp_status
LEFT JOIN dot_probe1 ON dp_status.mkturk_id = dot_probe1.mkturk_id
WHERE dot_probe1.mkturk_id = 'JT1';





# INSERTING AND UPDATING STATUS FOR EACH USER
INSERT INTO dp_status (mkturk_id,survey_asi)
VALUES ('TEST1','YES')
ON DUPLICATE KEY UPDATE survey_asi='YES';



# NEED THIS UPDATE. MIGHT NOT NEED TO
SET SQL_SAFE_UPDATES = 0;

# ADD CONSTRAINTS FOR UNIUE Column
ALTER TABLE dp_status ADD CONSTRAINT mid_table UNIQUE (mkturk_id);
ALTER TABLE dot_probe1 ADD CONSTRAINT mid_uniq_table UNIQUE (mkturk_id);



# RARELY USED QUERIES
DELETE FROM dot_probe1
WHERE mkturk_id = 'JT4';

DELETE FROM dp_status
WHERE mkturk_id = 'JT4';



# Rename the column names:
ALTER TABLE dp_status
CHANGE task_dp_T1 task_dotprobe_T1 varchar(45);

ALTER TABLE dp_status
CHANGE task_dp_T2 task_dotprobe_T2 varchar(45);

# Need to rename column names since ASi will be replaced by PANAS
ALTER TABLE dp_status CHANGE survey_asi_T1 survey_panas_T1 varchar(45);

ALTER TABLE dp_status CHANGE survey_asi_T2 survey_panas_T2 varchar(45);


# SHOW RECORDS IN THE TABLES

SELECT * FROM dot_probe1;
SELECT * FROM dp_status;



# DELETE ROWS IN THE TABLE
TRUNCATE dp_status;
TRUNCATE dot_probe1;


# Making mkturk_id nullable
ALTER TABLE subjects MODIFY mkturk_id VARCHAR(45);


# Making column uniq
ALTER TABLE subjects ADD UNIQUE (mkturk_id);
 

ALTER TABLE subjects ALTER task_version SET DEFAULT 1;

## CAREFUL WITH THESE QUERIES:!!

DROP TABLE dp_status;

