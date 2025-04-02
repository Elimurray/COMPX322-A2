<?php
$con = null;

header('Content-Type: application/json');


try {
    $con = new PDO('mysql:host=learn-mysql.cms.waikato.ac.nz;dbname=em437', 'em437', 'my392517sql');
} catch (PDOException $e) {
    echo "Database connection error " . $e->getMessage();
}


$sql = "SELECT * FROM commodities";
$result = $con->query($sql)->fetchAll(PDO::FETCH_ASSOC);




echo json_encode($result);
