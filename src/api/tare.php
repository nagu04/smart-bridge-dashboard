<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$pdo = require __DIR__ . '/../db.php';
$payload = json_decode(file_get_contents('php://input'), true) ?? [];

$stmt = $pdo->prepare('INSERT INTO commands (command, payload, status) VALUES (?, ?, ?)');
$stmt->execute([
    'tare',
    json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    'pending',
]);

$commandId = $pdo->lastInsertId();

echo json_encode([
    'success' => true,
    'command_id' => $commandId,
    'message' => 'Tare request queued successfully',
]);
