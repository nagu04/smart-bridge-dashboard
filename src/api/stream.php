<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// 1. Pull in your existing database architecture
$pdo = require __DIR__ . '/../db.php';
require_once __DIR__ . '/../logger.php';
require_once __DIR__ . '/../notify.php';
$config = require __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // ==========================================
    // DASHBOARD IS FETCHING LATEST DATA
    // ==========================================
    try {
        // Query the single absolute newest entry from the readings table
        $stmt = $pdo->query("SELECT * FROM readings ORDER BY id DESC LIMIT 1");
        $reading = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($reading) {
            // Convert database integers/strings to explicit floats/ints matching app.js expectations
            echo json_encode([
                "id"            => (int)$reading['id'],
                "weight"        => (float)$reading['weight'],
                "stress"        => (float)$reading['stress'],
                "tilt"          => (float)$reading['tilt'],
                "vibration"     => (float)$reading['vibration'],
                "gate_status"   => $reading['gate_status'],
                "system_status" => $reading['system_status'],
                "critical"      => (int)$reading['critical'],
                "created_at"    => $reading['created_at']
            ]);
        } else {
            // Fail-safe backup defaults if the database is currently empty
            echo json_encode([
                "id" => 0, "weight" => 0.0, "stress" => 0.0, "tilt" => 0.0, "vibration" => 9.81,
                "gate_status" => "CLOSED", "system_status" => "HEALTHY", "critical" => 0
            ]);
        }
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }

} elseif ($method === 'POST') {
    // ==========================================
    // PYTHON IS STREAMING LIVE ESP32 SENSOR DATA IN
    // ==========================================
    $inputData = file_get_contents("php://input");
    $data = json_decode($inputData, true);

    if ($data === null) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Malformed JSON body"]);
        exit;
    }

    // Extract measurements sent over by Python
    $weight = isset($data['weight']) ? (float)$data['weight'] : 0.0;
    $stress = isset($data['stress']) ? (float)$data['stress'] : 0.0;
    $tilt   = isset($data['tilt'])   ? (float)$data['tilt']   : 0.0;
    $vibe   = isset($data['vibration']) ? (float)$data['vibration'] : 9.81;

    // Determine gate & safety conditions based on your ESP32 thresholds
    // ESP32 closes its gate when weight >= 19.0 KG
    $gate_status = ($weight < 19.0) ? "OPEN" : "CLOSED"; 
    
    // Evaluate if systemic metrics exceed critical safety configurations
    $is_critical = 0;
    $system_status = "HEALTHY";
    
    if ($stress >= $config['thresholds']['stress_crit'] || 
        $weight >= $config['thresholds']['weight_crit']) {
        $is_critical = 1;
        $system_status = "CRITICAL";
    } elseif ($stress >= $config['thresholds']['stress_warn'] || 
              $weight >= $config['thresholds']['weight_warn']) {
        $system_status = "WARNING";
    }

    try {
        // Insert into the 'readings' table structure found in your db.php
        $stmt = $pdo->prepare("INSERT INTO readings 
            (weight, stress, tilt, vibration, gate_status, system_status, api_key, critical, raw_data) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt->execute([
            $weight, 
            $stress, 
            $tilt, 
            $vibe, 
            $gate_status, 
            $system_status, 
            $config['api_key'], 
            $is_critical, 
            $inputData
        ]);

        $reading_id = $pdo->lastInsertId();

        // Systemic Safety Logic: Trigger logs and text alert hooks if a critical violation happens
        if ($is_critical === 1) {
            $alertMsg = "CRITICAL VIOLATION: Weight: {$weight}kg, Stress: {$stress}%!";
            
            // Log to database via your logger.php script
            log_message('CRITICAL', $alertMsg);
            
            // Dispatch a text hook if configuration enabled it via your notify.php script
            send_sms($alertMsg);

            // Populate the alerts table reference
            $alertStmt = $pdo->prepare("INSERT INTO alerts 
                (reading_id, alert_type, message, weight, stress, tilt, vibration, gate_status, system_status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $alertStmt->execute([
                $reading_id, 'STRUCTURAL_CRITICAL', $alertMsg, 
                $weight, $stress, $tilt, $vibe, $gate_status, $system_status
            ]);
        }

        echo json_encode(["status" => "success", "inserted_id" => $reading_id]);

    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database write failure: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not supported"]);
}