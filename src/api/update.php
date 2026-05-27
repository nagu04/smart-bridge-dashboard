<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-KEY');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$config = require __DIR__ . '/../config.php';
$pdo = require __DIR__ . '/../db.php';

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload']);
    exit;
}

$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $payload['api_key'] ?? '';
if (!hash_equals($config['api_key'], (string)$apiKey)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized: invalid API key']);
    exit;
}

$weight = filter_var($payload['weight'] ?? null, FILTER_VALIDATE_FLOAT);
$stress = filter_var($payload['stress'] ?? null, FILTER_VALIDATE_FLOAT);
$tilt = filter_var($payload['tilt'] ?? null, FILTER_VALIDATE_FLOAT);
$vibration = filter_var($payload['vibration'] ?? null, FILTER_VALIDATE_FLOAT);
$gateStatus = trim((string)($payload['gate_status'] ?? 'unknown'));
$systemStatus = trim((string)($payload['system_status'] ?? 'unknown'));
$timestamp = filter_var($payload['timestamp'] ?? null, FILTER_VALIDATE_INT);

if ($weight === false || $stress === false || $tilt === false || $vibration === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing or invalid numeric sensor values']);
    exit;
}

 $allowedGateStatuses = ['OPEN', 'CLOSED', 'MOVING', 'UNKNOWN'];
 $gateStatus = strtoupper($gateStatus);
if (!in_array($gateStatus, $allowedGateStatuses, true)) {
    $gateStatus = 'UNKNOWN';
}

 $allowedSystemStatuses = ['ONLINE', 'RECONNECTING', 'OFFLINE', 'UNKNOWN'];
 $systemStatus = strtoupper($systemStatus);
 if (!in_array($systemStatus, $allowedSystemStatuses, true)) {
     $systemStatus = 'UNKNOWN';
 }

$createdAt = $timestamp ? date('Y-m-d H:i:s', $timestamp) : date('Y-m-d H:i:s');

$thresholds = $config['thresholds'];
$isCritical = ($stress >= $thresholds['stress_crit']) ||
    ($vibration >= $thresholds['vibration_crit']) ||
    (abs($tilt) >= $thresholds['tilt_crit']) ||
    ($weight >= $thresholds['weight_crit']);

$rawData = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

$stmt = $pdo->prepare('INSERT INTO readings (weight, stress, tilt, vibration, gate_status, system_status, api_key, critical, raw_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([
    $weight,
    $stress,
    $tilt,
    $vibration,
    $gateStatus,
    $systemStatus,
    $apiKey,
    $isCritical ? 1 : 0,
    $rawData,
    $createdAt,
]);

$readingId = $pdo->lastInsertId();

if ($isCritical) {
    $alertStmt = $pdo->prepare('INSERT INTO alerts (reading_id, alert_type, message, weight, stress, tilt, vibration, gate_status, system_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $alertStmt->execute([
        $readingId,
        'CRITICAL',
        'Critical condition detected from ESP32.',
        $weight,
        $stress,
        $tilt,
        $vibration,
        $gateStatus,
        $systemStatus,
        $createdAt,
    ]);
}

echo json_encode([
    'success' => true,
    'reading_id' => $readingId,
    'critical' => $isCritical,
    'created_at' => $createdAt,
]);
