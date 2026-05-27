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
            $message = sprintf('Critical alert: weight=%s, stress=%s, vibration=%s, tilt=%s', $row['weight'], $row['stress'], $row['vibration'], $row['tilt']);
            send_sms($message);
            log_message('critical', $message);
        } else {
            log_message('info', 'Reading received: ' . json_encode($row));
        }
        @ob_flush();
        @flush();
    }
    sleep(1);
}
