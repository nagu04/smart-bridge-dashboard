<?php
header('Content-Type: application/json');

// Simple file-based settings (can be upgraded to DB)
$settingsFile = __DIR__ . '/../../data/settings.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // Save settings
  $data = json_decode(file_get_contents('php://input'), true);
  file_put_contents($settingsFile, json_encode($data, JSON_PRETTY_PRINT));
  echo json_encode(['success' => true, 'message' => 'Settings saved']);
} else {
  // Get settings
  if (file_exists($settingsFile)) {
    $settings = json_decode(file_get_contents($settingsFile), true);
  } else {
    $settings = [
      'flex_threshold_warn' => 30,
      'flex_threshold_crit' => 40,
      'vibe_threshold_warn' => 10,
      'vibe_threshold_crit' => 12,
      'load_threshold_warn' => 800,
      'load_threshold_crit' => 950,
      'sound_enabled' => true,
      'auto_refresh' => 2,
      'dark_mode' => true,
      'alerts_enabled' => true,
    ];
  }
  echo json_encode($settings);
}
