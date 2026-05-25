<?php
return [
    'db' => [
        'driver' => 'sqlite', // 'sqlite' or 'mysql'
        'sqlite_path' => __DIR__ . '/../data/app.db',
        // mysql example:
        // 'host' => '127.0.0.1', 'dbname' => 'dashboard', 'user' => 'root', 'pass' => ''
    ],
    'sms' => [
        'enabled' => false,
        'twilio_sid' => '',
        'twilio_token' => '',
        'from' => '',
        'to' => '',
    ],
];
