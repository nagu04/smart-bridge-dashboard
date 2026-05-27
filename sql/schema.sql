 
CREATE TABLE IF NOT EXISTS readings (
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
);

CREATE TABLE IF NOT EXISTS alerts (
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
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_readings_created_at ON readings(created_at);
