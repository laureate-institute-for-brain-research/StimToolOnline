-- MySQL dump 10.13  Distrib 5.7.20, for osx10.12 (x86_64)
--
-- Host: localhost    Database: mk_turk1
-- ------------------------------------------------------
-- Server version	5.7.20

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `dot_probe1`
--

DROP TABLE IF EXISTS `dot_probe1`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dot_probe1` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mkturk_id` varchar(45) DEFAULT NULL,
  `email` varchar(45) DEFAULT NULL,
  `remind` varchar(45) DEFAULT NULL,
  `time_created` varchar(45) DEFAULT NULL,
  `time_ready` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dot_probe1`
--

LOCK TABLES `dot_probe1` WRITE;
/*!40000 ALTER TABLE `dot_probe1` DISABLE KEYS */;
INSERT INTO `dot_probe1` VALUES (8,'TEST1','james@touthang.info','YES','Sun Dec 10 2017 21:50:57 GMT-0600 (CST)','Mon Dec 11 2017 21:50:57 GMT-0600 (CST)'),(9,'TEST2','james@touthang.info','YES','Sun Dec 10 2017 21:54:15 GMT-0600 (CST)','Mon Dec 11 2017 21:54:15 GMT-0600 (CST)'),(10,'TEST3','james@touthang.info','YES','Mon Dec 11 2017 01:34:41 GMT-0600 (CST)','Tue Dec 12 2017 01:34:41 GMT-0600 (CST)'),(11,'TEST4','james@touthang.info','undefined','Mon Dec 11 2017 14:46:56 GMT-0600 (CST)','Tue Dec 12 2017 14:46:56 GMT-0600 (CST)'),(12,'TEST123456789','james@touthang.info','undefined','Tue Dec 12 2017 16:05:49 GMT-0600 (CST)','Wed Dec 13 2017 16:05:49 GMT-0600 (CST)'),(13,'TEST123','james@touthang.info','YES','Tue Dec 12 2017 16:07:50 GMT-0600 (CST)','Wed Dec 13 2017 16:07:50 GMT-0600 (CST)');
/*!40000 ALTER TABLE `dot_probe1` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-12-13 13:14:59
