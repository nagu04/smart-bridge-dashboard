<?php
require __DIR__ . '/../db.php';

$data = [
    'bridge_temp' => rand(10, 40),
    'vibration' => rand(0, 120) / 10,
    'load' => rand(0, 1000) / 10,
];
$critical = ($data['vibration'] > 8 || $data['bridge_temp'] > 35) ? 1 : 0;

$stmt = $pdo->prepare('INSERT INTO readings (ts, data, critical) VALUES (?, ?, ?)');
$stmt->execute([time(), json_encode($data), $critical]);

echo "Inserted sample reading\n";
