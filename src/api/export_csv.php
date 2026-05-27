<?php
$pdo = require __DIR__ . '/../db.php';

$stmt = $pdo->query('SELECT * FROM readings ORDER BY created_at DESC LIMIT 1000');
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$filename = 'bridge-report-' . date('Y-m-d-H-i-s') . '.csv';
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename=' . $filename);

$output = fopen('php://output', 'w');
fputcsv($output, ['ID', 'Timestamp', 'Weight (kg)', 'Stress (%)', 'Tilt (°)', 'Vibration', 'Gate', 'Status', 'Critical']);

foreach ($rows as $row) {
    fputcsv($output, [
        $row['id'],
        $row['created_at'],
        $row['weight'],
        $row['stress'],
        $row['tilt'],
        $row['vibration'],
        $row['gate_status'],
        $row['system_status'],
        $row['critical'] ? 'Yes' : 'No'
    ]);
}

fclose($output);
