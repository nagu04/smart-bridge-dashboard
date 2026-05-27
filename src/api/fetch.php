<?php
$pdo = require __DIR__ . '/../db.php';
header('Content-Type: application/json');

$filter = $_GET['filter'] ?? '1h';
$interval = match($filter) {
    '1h' => 3600,
    '24h' => 86400,
    '7d' => 604800,
    default => 86400,
};

$since = date('Y-m-d H:i:s', time() - $interval);
$stmt = $pdo->prepare('SELECT * FROM readings WHERE created_at >= ? ORDER BY created_at ASC');
$stmt->execute([$since]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'filter' => $filter,
    'data' => $rows,
]);
