<?php
try {
    $db = new PDO('sqlite:data/app.db');
    $schema = file_get_contents(__DIR__ . '/sql/schema.sql');
    $db->exec($schema);
    echo "Database initialized successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
