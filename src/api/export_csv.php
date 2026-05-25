<?php
$pdo = require __DIR__ . '/../src/db.php';

// Get all readings
$stmt = $pdo->query('SELECT * FROM readings ORDER BY ts DESC LIMIT 1000');
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$filename = 'bridge-report-' . date('Y-m-d-H-i-s') . '.csv';
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename=' . $filename);

$output = fopen('php://output', 'w');
fputcsv($output, ['ID', 'Timestamp', 'Temperature (°C)', 'Vibration (Hz)', 'Load (kg)', 'Critical']);

foreach ($rows as $row) {
  $data = json_decode($row['data'], true);
  fputcsv($output, [
    $row['id'],
    date('Y-m-d H:i:s', $row['ts']),
    $data['bridge_temp'] ?? 0,
    $data['vibration'] ?? 0,
    $data['load'] ?? 0,
    $row['critical'] ? 'Yes' : 'No'
  ]);
}

fclose($output);
