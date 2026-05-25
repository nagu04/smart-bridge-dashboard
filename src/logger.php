<?php
$pdo = require __DIR__ . '/db.php';

function log_message($level, $message) {
    global $pdo;
    $stmt = $pdo->prepare('INSERT INTO logs (ts, level, message) VALUES (?, ?, ?)');
    $stmt->execute([time(), $level, $message]);
}
