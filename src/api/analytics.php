<?php
$pdo = require __DIR__ . '/../db.php';

$filter = $_GET['filter'] ?? '24h';
$interval = match($filter) {
    '1h' => 3600,
    '7d' => 604800,
    default => 86400,
};

$since = date('Y-m-d H:i:s', time() - $interval);
$stmt = $pdo->prepare('SELECT * FROM readings WHERE created_at >= ? ORDER BY created_at DESC LIMIT 200');
$stmt->execute([$since]);
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

$weights = array_map(fn($r) => floatval($r['weight']), $data);
$stresses = array_map(fn($r) => floatval($r['stress']), $data);
$vibrations = array_map(fn($r) => floatval($r['vibration']), $data);
$tilts = array_map(fn($r) => floatval($r['tilt']), $data);

$stats = [
    'weight_avg' => count($weights) ? array_sum($weights) / count($weights) : 0,
    'weight_max' => count($weights) ? max($weights) : 0,
    'stress_avg' => count($stresses) ? array_sum($stresses) / count($stresses) : 0,
    'stress_max' => count($stresses) ? max($stresses) : 0,
    'vibration_avg' => count($vibrations) ? array_sum($vibrations) / count($vibrations) : 0,
    'vibration_max' => count($vibrations) ? max($vibrations) : 0,
    'tilt_avg' => count($tilts) ? array_sum($tilts) / count($tilts) : 0,
    'tilt_max' => count($tilts) ? max($tilts) : 0,
];

header('Content-Type: application/json');
echo json_encode([
    'stats' => $stats,
    'data' => $data,
]);
