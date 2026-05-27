<?php
// Simple runner to initialize DB tables via src/db.php
try {
    $pdo = require __DIR__ . '/db.php';
    echo "OK: DB initialized\n";
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
