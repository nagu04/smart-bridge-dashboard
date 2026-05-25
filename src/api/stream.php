<?php
require __DIR__ . '/../db.php';
require __DIR__ . '/../logger.php';
require __DIR__ . '/../notify.php';

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
set_time_limit(0);

$lastId = intval($_GET['last_id'] ?? 0);

while (true) {
    $stmt = $pdo->prepare('SELECT * FROM readings WHERE id > ? ORDER BY id ASC');
    $stmt->execute([$lastId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        $lastId = (int)$row['id'];
        echo "event: reading\n";
        echo 'data: ' . json_encode($row) . "\n\n";
        if ($row['critical']) {
            send_sms('Critical alert: ' . $row['data']);
            log_message('critical', 'Critical reading: ' . $row['data']);
        } else {
            log_message('info', 'Reading: ' . $row['data']);
        }
        @ob_flush();
        @flush();
    }
    sleep(1);
}
