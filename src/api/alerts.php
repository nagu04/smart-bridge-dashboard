<?php
$pdo = require __DIR__ . '/../db.php';
header('Content-Type: application/json');

$stmt = $pdo->query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50');
$alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

$result = [];
foreach ($alerts as $alert) {
    $result[] = [
        'id' => $alert['id'],
        'reading_id' => $alert['reading_id'],
        'type' => $alert['alert_type'],
        'message' => $alert['message'],
        'weight' => floatval($alert['weight']),
        'stress' => floatval($alert['stress']),
        'tilt' => floatval($alert['tilt']),
        'vibration' => floatval($alert['vibration']),
        'gate_status' => $alert['gate_status'],
        'system_status' => $alert['system_status'],
        'created_at' => $alert['created_at'],
    ];
}

echo json_encode(['alerts' => $result]);
