<?php
header('Content-Type: application/json');

$settingsFile = __DIR__ . '/../../data/settings.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid settings payload']);
        exit;
    }
    file_put_contents($settingsFile, json_encode($data, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true, 'message' => 'Settings saved']);
    exit;
}

if (file_exists($settingsFile)) {
    $settings = json_decode(file_get_contents($settingsFile), true);
} else {
    $settings = [
        'stress_threshold_warn' => 50,
        'stress_threshold_crit' => 75,
        'vibration_threshold_warn' => 10,
        'vibration_threshold_crit' => 15,
        'tilt_threshold_warn' => 8,
        'tilt_threshold_crit' => 12,
        'weight_threshold_warn' => 800,
        'weight_threshold_crit' => 950,
        'sound_enabled' => true,
        'auto_refresh' => 2,
        'dark_mode' => true,
        'alerts_enabled' => true,
        'esp32_max_weight_bar_kg' => 35.0,
        'esp32_max_strain_bridge_kg' => 40.0,
    ];
}

echo json_encode($settings);
