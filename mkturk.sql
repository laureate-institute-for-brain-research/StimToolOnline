
# SHOW RECORDS IN THE TABLES
select * from dot_probe1;
select * from DP_status;



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
  PRIMARY KEY (`id`));


INSERT INTO dp_status (mkturk_id, survey_oasis ) VALUES ( 'TEST1' ,'YES') ON DUPLICATE KEY UPDATE survey_oasis='YES';



UPDATE dp_status SET `survey_asi`='YES' WHERE `mkturk_id`='TEST2';


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

# DELETE ROWS IN THE TABLE
TRUNCATE dp_status;
TRUNCATE dot_probe1;



## CAREFUL WITH THESE QUERIES:!!

DROP TABLE dp_status;