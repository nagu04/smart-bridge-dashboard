<?php
$config = require __DIR__.'/config.php';

if ($config['db']['driver'] === 'sqlite') {
    $path = $config['db']['sqlite_path'];
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    $pdo = new PDO('sqlite:' . $path);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // ensure tables exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS readings (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, data TEXT NOT NULL, critical INTEGER DEFAULT 0);");
    $pdo->exec("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, level TEXT NOT NULL, message TEXT NOT NULL);");
} else {
    $db = $config['db'];
    $dsn = "mysql:host={$db['host']};dbname={$db['dbname']};charset=utf8mb4";
    $pdo = new PDO($dsn, $db['user'], $db['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}

return $pdo;
