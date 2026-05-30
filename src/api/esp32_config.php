<?php
header('Content-Type: application/json');

$settingsFile = __DIR__ . '/../../data/settings.json';

$config = [
    'max_weight_bar_kg' => 35.0,
    'max_strain_bridge_kg' => 40.0,
];

if (file_exists($settingsFile)) {
    $settings = json_decode(file_get_contents($settingsFile), true);
    if (isset($settings['esp32_max_weight_bar_kg'])) {
        $config['max_weight_bar_kg'] = floatval($settings['esp32_max_weight_bar_kg']);
    }
    if (isset($settings['esp32_max_strain_bridge_kg'])) {
        $config['max_strain_bridge_kg'] = floatval($settings['esp32_max_strain_bridge_kg']);
    }
}

echo json_encode($config);
