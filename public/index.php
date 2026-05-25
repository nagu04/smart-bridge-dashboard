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
        </div>

        <!-- Sensor Cards Grid -->
        <div class="cards-grid">
          
          <!-- Flex Sensor Card -->
          <div class="sensor-card" data-sensor="flex">
            <div class="sensor-header">
              <div class="sensor-title">
                <div class="sensor-icon">📏</div>
                Flex Sensor
              </div>
              <div class="sensor-status" id="flexStatus"></div>
            </div>
            <div class="sensor-value" id="flexVal">--</div>
            <div class="sensor-unit">mm strain</div>
            <div class="sensor-gauge">
              <div class="gauge-fill" id="flexGauge"></div>
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
          <div id="bridgeViz" style="height: 200px; display: flex; align-items: center; justify-content: center;">
            <svg viewBox="0 0 400 150" width="100%" height="100%">
              <!-- Bridge support left -->
              <rect x="20" y="80" width="10" height="60" fill="#00D9FF" opacity="0.6"/>
              <!-- Bridge support right -->
              <rect x="370" y="80" width="10" height="60" fill="#00D9FF" opacity="0.6"/>
              <!-- Bridge deck -->
              <rect id="bridgeDeck" x="30" y="75" width="340" height="15" fill="#3A86FF" stroke="#00D9FF" stroke-width="2"/>
              <!-- Load indicator -->
              <circle id="loadDot" cx="200" cy="70" r="6" fill="#FFC400" stroke="#FFD700" stroke-width="2" class="sensor-dot" data-sensor="load"/>
              <!-- Stress markers -->
              <line x1="100" y1="60" x2="100" y2="100" stroke="#C77DFF" stroke-width="1" opacity="0.5" class="sensor-marker" data-point="1"/>
              <line x1="200" y1="60" x2="200" y2="100" stroke="#C77DFF" stroke-width="1" opacity="0.5" class="sensor-marker" data-point="2"/>
              <line x1="300" y1="60" x2="300" y2="100" stroke="#C77DFF" stroke-width="1" opacity="0.5" class="sensor-marker" data-point="3"/>
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
            <label class="form-label">Flex Sensor Warning (mm)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="flexWarnSlider" min="10" max="50" value="30">
              <span id="flexWarnValue" style="min-width: 40px; color: #C77DFF; font-weight: 600;">30</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Flex Sensor Critical (mm)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="flexCritSlider" min="30" max="60" value="40">
              <span id="flexCritValue" style="min-width: 40px; color: #FF5252; font-weight: 600;">40</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Vibration Warning (Hz)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="vibeWarnSlider" min="5" max="15" value="10">
              <span id="vibeWarnValue" style="min-width: 40px; color: #C77DFF; font-weight: 600;">10</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Vibration Critical (Hz)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="vibeCritSlider" min="10" max="20" value="12">
              <span id="vibeCritValue" style="min-width: 40px; color: #FF5252; font-weight: 600;">12</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Load Warning (kg)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="loadWarnSlider" min="500" max="900" step="50" value="800">
              <span id="loadWarnValue" style="min-width: 60px; color: #C77DFF; font-weight: 600;">800</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Load Critical (kg)</label>
            <div style="display: flex; gap: 16px; align-items: center;">
              <input type="range" class="form-range" id="loadCritSlider" min="850" max="1000" step="50" value="950">
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

          <button class="btn" id="saveSettingsBtn" style="width: 100%; margin-top: 20px;">Save Settings</button>
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
