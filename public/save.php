<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $customString = $_POST["customString"];
    $idandrow = explode("|",$customString);
    $id = $idandrow[0];
    $row = explode(";",$idandrow[1]);
    
    $filename = '/media/stimtool_online/ABCFloat/'.$id.'_somatomapdata.csv';
    
    // open csv file for writing
    $f = fopen($filename, 'a');
    
    if ($f === false) {
    	die('Error opening the file ' . $filename);
        // die(phpinfo());
    }
    
    // write each row at a time to a file
    fputcsv($f, $row);
    // close the file
    fclose($f);
    
    // Redirect back to the HTML page
    header("Location: index.html");
    exit;
}
?>

