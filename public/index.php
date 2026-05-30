<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ESP-32 Smart Bridge Dashboard</title>
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="stylesheet" href="assets/css/components.css">
</head>
<body>

<div class="dashboard">
  <!-- Sidebar -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v6M4 8h16M2 12h20M4 16h16M12 22v-6"></path>
      </svg>
      <h2>BRIDGE</h2>
    </div>
    
    <nav class="sidebar-nav">
      <a href="#" class="nav-item active" data-page="dashboard">
        <span>📊</span>
        Dashboard
      </a>
      <a href="#" class="nav-item" data-page="analytics">
        <span>📈</span>
        Analytics
      </a>
      <a href="#" class="nav-item" data-page="reports">
        <span>📋</span>
        Reports
      </a>
      <a href="#" class="nav-item" data-page="settings">
        <span>⚙️</span>
        Settings
      </a>
    </nav>
  </aside>

  <!-- Main Content -->
  <div class="main-content">
    <!-- Top Navigation -->
    <nav class="top-nav">
      <div class="nav-left">
        <h1 id="pageTitle">Structural Monitoring</h1>
      </div>
      <div class="nav-right">
        <div class="time-display" id="timeDisplay"></div>
        <div class="status-badge" id="connStatus">
          <span class="status-dot"></span>
          ESP-32 Connected
        </div>
        <div class="status-badge secondary" id="esp32Status">Status: OFFLINE</div>
        <div class="status-badge secondary" id="lastSeenBadge">Last update: --</div>
        <button class="btn btn-outline" id="seedBtn">+ Sample Data</button>
      </div>
    </nav>

    <!-- Main Content Area -->
    <div class="content" id="content">
      
      <!-- Alert Banner -->
      <div class="alert-banner" id="alertBanner">
        <div class="alert-banner-icon">!</div>
        <div class="alert-banner-text">
          <h4>CRITICAL ALERT</h4>
          <p id="alertText">Vibration levels exceed safe threshold</p>
        </div>
      </div>

      <!-- Dashboard Page (default) -->
      <div id="dashboardPage" class="page-content">
        
        <!-- Status Indicator -->
        <div class="status-indicator">
          <div class="status-main">
            <div class="status-circle" id="statusCircle">
              <span>SAFE</span>
            </div>
            <div class="status-text">
              <h3 id="statusTitle">Bridge Status</h3>
              <p id="statusDesc">All systems nominal. Continuous monitoring active.</p>
            </div>
          </div>
          <div class="status-meta" style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
            <div class="status-badge secondary">ESP32: <strong id="esp32SystemStatus">OFFLINE</strong></div>
            <div class="status-badge secondary">Last update: <strong id="lastSeen">--</strong></div>
            <button class="btn btn-outline" id="tareBtn" style="min-width: 120px;">Tare Scales</button>
          </div>
        </div>

        <!-- Sensor Cards Grid -->
        <div class="cards-grid">
          
          <!-- Stress Sensor Card -->
          <div class="sensor-card" data-sensor="stress">
            <div class="sensor-header">
              <div class="sensor-title">
                <div class="sensor-icon">📏</div>
                Structural Stress
              </div>
              <div class="sensor-status" id="stressStatus"></div>
            </div>
            <div class="sensor-value" id="stressVal">--</div>
            <div class="sensor-unit">%</div>
            <div class="sensor-gauge">
              <div class="gauge-fill" id="stressGauge"></div>
            </div>
          </div>

          <!-- Vibration Sensor Card -->
          <div class="sensor-card" data-sensor="vibe">
            <div class="sensor-header">
              <div class="sensor-title">
                <div class="sensor-icon">📡</div>
                Vibration
              </div>
              <div class="sensor-status" id="vibeStatus"></div>
            </div>
            <div class="sensor-value" id="vibeVal">--</div>
            <div class="sensor-unit">Hz</div>
            <div class="sensor-gauge">
              <div class="gauge-fill" id="vibeGauge"></div>
            </div>
          </div>

          <!-- Weight Sensor Card -->
          <div class="sensor-card" data-sensor="load">
            <div class="sensor-header">
              <div class="sensor-title">
                <div class="sensor-icon">⚖️</div>
                Load Weight
              </div>
              <div class="sensor-status" id="loadStatus"></div>
            </div>
            <div class="sensor-value" id="loadVal">--</div>
            <div class="sensor-unit">kg</div>
            <div class="sensor-gauge">
              <div class="gauge-fill" id="loadGauge"></div>
            </div>
          </div>

          <!-- Tilt Sensor Card -->
          <div class="sensor-card" data-sensor="tilt">
            <div class="sensor-header">
              <div class="sensor-title">
                <div class="sensor-icon">📐</div>
                Tilt Angle
              </div>
              <div class="sensor-status" id="tiltStatus"></div>
            </div>
            <div class="sensor-value" id="tiltVal">--</div>
            <div class="sensor-unit">°</div>
            <div class="sensor-gauge">
              <div class="gauge-fill" id="tiltGauge"></div>
            </div>
          </div>

        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          
          <div class="chart-card">
            <h5 class="chart-title">Temperature Trend</h5>
            <canvas id="tempChart"></canvas>
          </div>

          <div class="chart-card">
            <h5 class="chart-title">Vibration History</h5>
            <canvas id="vibeChart"></canvas>
          </div>

        </div>

        <!-- Bridge Visualization -->
        <div class="chart-card" style="margin-bottom: 24px;">
          <h5 class="chart-title">Bridge Visualization</h5>
          <div id="bridgeViz" style="height: 220px; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 420 170" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="deckGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#3A86FF" />
                  <stop offset="100%" stop-color="#00D9FF" />
                </linearGradient>
              </defs>

              <!-- Bottom and top chords -->
              <line class="bridge-body" id="bridgeDeck" x1="20" y1="110" x2="400" y2="110" />
              <line class="bridge-body" x1="20" y1="50" x2="400" y2="50" opacity="0.85" />

              <!-- Vertical posts -->
              <line class="bridge-body" x1="60" y1="50" x2="60" y2="110" />
              <line class="bridge-body" x1="120" y1="50" x2="120" y2="110" />
              <line class="bridge-body" x1="180" y1="50" x2="180" y2="110" />
              <line class="bridge-body" x1="240" y1="50" x2="240" y2="110" />
              <line class="bridge-body" x1="300" y1="50" x2="300" y2="110" />
              <line class="bridge-body" x1="360" y1="50" x2="360" y2="110" />

              <!-- Primary Warren diagonals -->
              <line class="truss-line" x1="20" y1="110" x2="60" y2="50" />
              <line class="truss-line" x1="60" y1="50" x2="120" y2="110" />
              <line class="truss-line" x1="120" y1="110" x2="180" y2="50" />
              <line class="truss-line" x1="180" y1="50" x2="240" y2="110" />
              <line class="truss-line" x1="240" y1="110" x2="300" y2="50" />
              <line class="truss-line" x1="300" y1="50" x2="360" y2="110" />
              <line class="truss-line" x1="360" y1="110" x2="400" y2="110" />

              <!-- Secondary Warren diagonals (double truss) -->
              <line class="truss-line" x1="60" y1="110" x2="120" y2="50" stroke-dasharray="6 4" />
              <line class="truss-line" x1="120" y1="110" x2="180" y2="50" stroke-dasharray="6 4" />
              <line class="truss-line" x1="180" y1="110" x2="240" y2="50" stroke-dasharray="6 4" />
              <line class="truss-line" x1="240" y1="110" x2="300" y2="50" stroke-dasharray="6 4" />
              <line class="truss-line" x1="300" y1="110" x2="360" y2="50" stroke-dasharray="6 4" />

              <!-- Bridge deck -->
              <rect x="20" y="110" width="380" height="10" fill="rgba(255,255,255,0.12)" />
              <circle id="loadDot" cx="50" cy="103" r="8" fill="#FFB703" stroke="#fff" stroke-width="2" filter="drop-shadow(0 0 8px rgba(255,183,3,0.35))" />
            </svg>
          </div>
        </div>

      </div>

      <!-- Analytics Page -->
      <div id="analyticsPage" class="page-content" style="display: none;">
        <div style="margin-bottom: 24px;">
          <div class="time-filter-group">
            <button class="filter-btn active" data-filter="1h">Last Hour</button>
            <button class="filter-btn" data-filter="24h">24 Hours</button>
            <button class="filter-btn" data-filter="7d">7 Days</button>
          </div>
        </div>

        <div class="stats-grid" id="statsGrid">
          <div class="stat-card skeleton-card"></div>
          <div class="stat-card skeleton-card"></div>
          <div class="stat-card skeleton-card"></div>
          <div class="stat-card skeleton-card"></div>
        </div>

        <div class="chart-card" style="margin-bottom: 24px;">
          <h5 class="chart-title">Detailed Temperature Analysis</h5>
          <canvas id="tempAnalysisChart"></canvas>
        </div>

        <div class="chart-card">
          <h5 class="chart-title">Detailed Vibration Analysis</h5>
          <canvas id="vibeAnalysisChart"></canvas>
        </div>
      </div>

      <!-- Reports Page -->
      <div id="reportsPage" class="page-content" style="display: none;">
        <div style="margin-bottom: 24px; display: flex; gap: 12px;">
          <button class="btn" id="exportCsvBtn">📥 Export CSV</button>
          <button class="btn" id="exportPdfBtn">📥 Export PDF</button>
          <button class="btn btn-outline" id="viewAlertsBtn">⚠️ View Alert History</button>
        </div>

        <div id="reportsContent">
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-title">Reports & Analytics</div>
            <div class="empty-state-text">Export your bridge monitoring data in CSV or PDF format</div>
          </div>
        </div>
      </div>

      <!-- Settings Page -->
      <div id="settingsPage" class="page-content" style="display: none;">
        <div class="tabs">
          <button class="tab-button active" data-tab="thresholds">Thresholds</button>
          <button class="tab-button" data-tab="system">System</button>
          <button class="tab-button" data-tab="alerts">Alerts</button>
        </div>

        <!-- Thresholds Tab -->
        <div class="tab-content" id="thresholdsTab">
          <div class="form-group">
            <label class="form-label">Bridge Stress Warning (%)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="flexWarnSlider" min="10" max="50" value="30">
              <input type="number" class="form-control" id="stressWarnInput" min="10" max="50" step="1" value="30" style="width: 80px;">
              <span id="flexWarnValue" style="min-width: 40px; color: #C77DFF; font-weight: 600;">30</span>
            </div>
            <small style="color: #A0AEC0;">Strain gauge stress warning threshold in %</small>
          </div>

          <div class="form-group">
            <label class="form-label">Bridge Stress Critical (%)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="flexCritSlider" min="30" max="60" value="40">
              <input type="number" class="form-control" id="stressCritInput" min="30" max="60" step="1" value="40" style="width: 80px;">
              <span id="flexCritValue" style="min-width: 40px; color: #FF5252; font-weight: 600;">40</span>
            </div>
            <small style="color: #A0AEC0;">Strain gauge stress critical threshold in %</small>
          </div>

          <div class="form-group">
            <label class="form-label">Vibration Warning (Hz)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="vibeWarnSlider" min="5" max="15" value="10">
              <input type="number" class="form-control" id="vibeWarnInput" min="5" max="15" step="1" value="10" style="width: 80px;">
              <span id="vibeWarnValue" style="min-width: 40px; color: #C77DFF; font-weight: 600;">10</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Vibration Critical (Hz)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="vibeCritSlider" min="10" max="20" value="12">
              <input type="number" class="form-control" id="vibeCritInput" min="10" max="20" step="1" value="12" style="width: 80px;">
              <span id="vibeCritValue" style="min-width: 40px; color: #FF5252; font-weight: 600;">12</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Load Warning (kg)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="loadWarnSlider" min="500" max="900" step="50" value="800">
              <input type="number" class="form-control" id="loadWarnInput" min="500" max="900" step="50" value="800" style="width: 80px;">
              <span id="loadWarnValue" style="min-width: 60px; color: #C77DFF; font-weight: 600;">800</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Load Critical (kg)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="loadCritSlider" min="850" max="1000" step="50" value="950">
              <input type="number" class="form-control" id="loadCritInput" min="850" max="1000" step="50" value="950" style="width: 80px;">
              <span id="loadCritValue" style="min-width: 60px; color: #FF5252; font-weight: 600;">950</span>
            </div>
          </div>
        </div>

        <!-- System Tab -->
        <div class="tab-content" id="systemTab" style="display: none;">
          <div class="form-group">
            <label class="form-label">Auto-Refresh Interval (seconds)</label>
            <input type="number" class="form-control" id="refreshIntervalInput" min="1" max="30" value="2">
          </div>

          <div class="form-group">
            <label class="form-label">Dark Mode</label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <label class="toggle-switch">
                <input type="checkbox" id="darkModeToggle" checked>
                <span class="toggle-slider"></span>
              </label>
              <span style="color: #A0AEC0;">Enabled</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">ESP32 Connection</label>
            <input type="text" class="form-control" id="esp32UrlInput" placeholder="ws://localhost:8000" disabled>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #2D3748;">

          <h3 style="color: #00D9FF; margin-bottom: 20px;">ESP32 Control Thresholds</h3>

          <div class="form-group">
            <label class="form-label">Max Weight Bar (kg)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="maxWeightBarSlider" min="10" max="50" step="1" value="35">
              <input type="number" class="form-control" id="maxWeightBarInput" min="10" max="50" step="1" value="35" style="width: 80px;">
              <span id="maxWeightBarValue" style="min-width: 40px; color: #00D9FF; font-weight: 600;">35</span>
            </div>
            <small style="color: #A0AEC0;">Max vehicle weight to open gate</small>
          </div>

          <div class="form-group">
            <label class="form-label">Max Strain Bridge (kg)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="maxStrainBridgeSlider" min="20" max="100" step="1" value="40">
              <input type="number" class="form-control" id="maxStrainBridgeInput" min="20" max="100" step="1" value="40" style="width: 80px;">
              <span id="maxStrainBridgeValue" style="min-width: 40px; color: #00D9FF; font-weight: 600;">40</span>
            </div>
            <small style="color: #A0AEC0;">Structural capacity limit for percentage calculation</small>
          </div>
        </div>

        <!-- Alerts Tab -->
        <div class="tab-content" id="alertsTab" style="display: none;">
          <div class="form-group">
            <label class="form-label">Enable Alerts</label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <label class="toggle-switch">
                <input type="checkbox" id="alertsEnabledToggle" checked>
                <span class="toggle-slider"></span>
              </label>
              <span style="color: #A0AEC0;">Enabled</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Sound Alerts</label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <label class="toggle-switch">
                <input type="checkbox" id="soundToggle" checked>
                <span class="toggle-slider"></span>
              </label>
              <span style="color: #A0AEC0;">Enabled</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Alert Message</label>
            <textarea class="form-control" id="alertMessageInput" rows="3" placeholder="Critical alert on bridge..."></textarea>
          </div>
        </div>

        <div style="margin-top: 24px;">
          <button class="btn" id="saveSettingsBtn" style="width: 100%;">Save Settings</button>
        </div>
      </div>

    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="assets/js/ui.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
