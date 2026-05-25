<?php
$pdo = require __DIR__ . '/../src/db.php';

// Get time filter from query
$filter = $_GET['filter'] ?? '24h';
$interval = match($filter) {
  '1h' => 3600,
  '7d' => 604800,
  default => 86400
};

$since = time() - $interval;
$stmt = $pdo->prepare('SELECT * FROM readings WHERE ts > ? ORDER BY ts DESC LIMIT 100');
$stmt->execute([$since]);
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate statistics
$temps = array_map(fn($r) => json_decode($r['data'], true)['bridge_temp'] ?? 0, $data);
$vibes = array_map(fn($r) => json_decode($r['data'], true)['vibration'] ?? 0, $data);
$loads = array_map(fn($r) => json_decode($r['data'], true)['load'] ?? 0, $data);

$stats = [
  'temp_avg' => count($temps) > 0 ? array_sum($temps) / count($temps) : 0,
  'temp_max' => count($temps) > 0 ? max($temps) : 0,
  'vibe_avg' => count($vibes) > 0 ? array_sum($vibes) / count($vibes) : 0,
  'vibe_max' => count($vibes) > 0 ? max($vibes) : 0,
  'load_avg' => count($loads) > 0 ? array_sum($loads) / count($loads) : 0,
  'load_max' => count($loads) > 0 ? max($loads) : 0,
];

header('Content-Type: application/json');
echo json_encode([
  'stats' => $stats,
  'data' => $data
]);
