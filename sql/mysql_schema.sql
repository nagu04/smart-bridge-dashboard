-- MySQL schema for ESP-32 Smart Bridge Dashboard

CREATE TABLE IF NOT EXISTS readings (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alerts (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
