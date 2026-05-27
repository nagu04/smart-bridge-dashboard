<?php
$config = require __DIR__.'/config.php';

if ($config['db']['driver'] === 'sqlite') {
    $path = $config['db']['sqlite_path'];
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    $pdo = new PDO('sqlite:' . $path);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weight REAL NOT NULL,
        stress REAL NOT NULL,
        tilt REAL NOT NULL,
        vibration REAL NOT NULL,
        gate_status TEXT NOT NULL,
        system_status TEXT NOT NULL,
        api_key TEXT,
        critical INTEGER DEFAULT 0,
        raw_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );");

    $pdo->exec("CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reading_id INTEGER NOT NULL,
        alert_type TEXT NOT NULL,
        message TEXT NOT NULL,
        weight REAL NOT NULL,
        stress REAL NOT NULL,
        tilt REAL NOT NULL,
        vibration REAL NOT NULL,
        gate_status TEXT NOT NULL,
        system_status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );");

    $pdo->exec("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, level TEXT NOT NULL, message TEXT NOT NULL);");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at);");
} else {
    $db = $config['db'];
    $dsn = "mysql:host={$db['host']};dbname={$db['dbname']};charset=utf8mb4";
    $pdo = new PDO($dsn, $db['user'], $db['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    $pdo->exec("CREATE TABLE IF NOT EXISTS readings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        weight DECIMAL(10,2) NOT NULL,
        stress DECIMAL(8,2) NOT NULL,
        tilt DECIMAL(8,2) NOT NULL,
        vibration DECIMAL(8,2) NOT NULL,
        gate_status VARCHAR(32) NOT NULL,
        system_status VARCHAR(32) NOT NULL,
        api_key VARCHAR(128),
        critical TINYINT(1) NOT NULL DEFAULT 0,
        raw_data TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_readings_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $pdo->exec("CREATE TABLE IF NOT EXISTS alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reading_id INT NOT NULL,
        alert_type VARCHAR(32) NOT NULL,
        message TEXT NOT NULL,
        weight DECIMAL(10,2) NOT NULL,
        stress DECIMAL(8,2) NOT NULL,
        tilt DECIMAL(8,2) NOT NULL,
        vibration DECIMAL(8,2) NOT NULL,
        gate_status VARCHAR(32) NOT NULL,
        system_status VARCHAR(32) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_alerts_created_at (created_at),
        CONSTRAINT fk_alert_reading FOREIGN KEY (reading_id) REFERENCES readings(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
}

return $pdo;
