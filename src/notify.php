<?php
$config = require __DIR__ . '/config.php';
require_once __DIR__ . '/logger.php';

function send_sms($message) {
    $cfg = require __DIR__ . '/config.php';
    if (empty($cfg['sms']['enabled'])) return false;
    // Placeholder: implement Twilio REST call or SDK here.
    // Example (not implemented): POST to Twilio API with SID/TOKEN
    log_message('alert', 'SMS queued: ' . $message);
    return true;
}
