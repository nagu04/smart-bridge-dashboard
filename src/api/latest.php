<?php
$pdo = require __DIR__ . '/../db.php';
header('Content-Type: application/json');

$stmt = $pdo->query('SELECT * FROM readings ORDER BY created_at DESC LIMIT 1');
$row = $stmt->fetch(PDO::FETCH_ASSOC);

$status = 'OFFLINE';
$lastSeen = null;
if ($row) {
    $lastSeen = $row['created_at'];
    $lastTimestamp = strtotime($lastSeen);
    $age = time() - $lastTimestamp;
    if ($age <= 5) {
        $status = 'ONLINE';
    } elseif ($age <= 20) {
        $status = 'RECONNECTING';
    }
}

echo json_encode([
    'reading' => $row ?: null,
    'esp32_status' => $status,
    'last_seen' => $lastSeen,
    'is_online' => $status === 'ONLINE',
]);
