<?php
$pdo = require __DIR__ . '/../db.php';

$weight = rand(500, 1000) / 10;
$stress = rand(20, 90);
$tilt = rand(-12, 12);
$vibration = rand(0, 200) / 10;
$gateStatus = $weight > 600 ? 'CLOSED' : 'OPEN';
$systemStatus = 'ONLINE';
$critical = ($stress >= 75 || $vibration >= 15 || abs($tilt) >= 12 || $weight >= 950) ? 1 : 0;

$stmt = $pdo->prepare('INSERT INTO readings (weight, stress, tilt, vibration, gate_status, system_status, api_key, critical, raw_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([
    $weight,
    $stress,
    $tilt,
    $vibration,
    $gateStatus,
    $systemStatus,
    'sample',
    $critical,
    json_encode([
        'weight' => $weight,
        'stress' => $stress,
        'tilt' => $tilt,
        'vibration' => $vibration,
        'gate_status' => $gateStatus,
        'system_status' => $systemStatus,
    ]),
    date('Y-m-d H:i:s'),
]);

echo "Inserted sample reading\n";
