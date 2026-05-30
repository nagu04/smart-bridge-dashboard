<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$pdo = require __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT id, command, payload FROM commands WHERE status = ? ORDER BY id ASC');
    $stmt->execute(['pending']);
    $commands = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($commands)) {
        $ids = array_column($commands, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $update = $pdo->prepare("UPDATE commands SET status = 'sent', processed_at = CURRENT_TIMESTAMP WHERE id IN ($placeholders)");
        $update->execute($ids);
    }

    echo json_encode([
        'success' => true,
        'commands' => $commands,
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
