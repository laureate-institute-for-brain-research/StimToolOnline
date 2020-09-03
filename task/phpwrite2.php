<?php
$myFile = "data/" . $_POST["name"];;

$fh = fopen($myFile, 'w') or die("can't open file");
$stringData = $_POST["content"];
fwrite($fh, $stringData);
fclose($fh);
?>
