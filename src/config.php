<?php
return [
    'db' => [
        'driver' => 'sqlite', // 'sqlite' or 'mysql'
        'sqlite_path' => __DIR__ . '/../data/app.db',
        // mysql example:
        // 'host' => '127.0.0.1',
        // 'dbname' => 'dashboard',
        // 'user' => 'root',
        // 'pass' => ''
    ],
    'sms' => [
        'enabled' => false,
        'twilio_sid' => '',
        'twilio_token' => '',
        'from' => '',
        'to' => '',
    ],
    // Note: keep this in sync with your device firmware `apiKey`
    'api_key' => 'your_api_key_here',
    'thresholds' => [
        'stress_warn' => 50,
        'stress_crit' => 75,
        'vibration_warn' => 10,
        'vibration_crit' => 15,
        'tilt_warn' => 8,
        'tilt_crit' => 12,
        'weight_warn' => 800,
        'weight_crit' => 950,
    ],
];
