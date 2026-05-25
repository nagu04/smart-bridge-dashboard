<?php
$pdo = require __DIR__ . '/../src/db.php';
header('Content-Type: application/json');

// Get alerts (critical readings)
$stmt = $pdo->query('SELECT * FROM readings WHERE critical = 1 ORDER BY id DESC LIMIT 50');
$alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

$result = [];
foreach ($alerts as $alert) {
  $data = json_decode($alert['data'], true);
  $result[] = [
    'id' => $alert['id'],
    'ts' => $alert['ts'],
    'data' => $data,
    'timestamp' => date('Y-m-d H:i:s', $alert['ts'])
  ];
}

echo json_encode(['alerts' => $result]);
