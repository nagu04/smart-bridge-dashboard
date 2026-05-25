<?php
require __DIR__ . '/../db.php';
header('Content-Type: application/json');
$stmt = $pdo->query('SELECT * FROM readings ORDER BY id DESC LIMIT 1');
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($row);
