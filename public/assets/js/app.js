const currentPath = window.location.pathname;
const rootPath = currentPath.includes('/public')
  ? currentPath.substring(0, currentPath.indexOf('/public'))
  : currentPath.replace(/\/(index\.php)?$/, '');
const apiBase = (window.location.origin + rootPath).replace(/\/$/, '') + '/src/api';

// STATE & CONFIG
let currentPage = 'dashboard';
let currentFilter = '24h';
let settings = {};

const defaultSettings = {
  stress_threshold_warn: 50,
  stress_threshold_crit: 75,
  vibration_threshold_warn: 10,
  vibration_threshold_crit: 15,
  weight_threshold_warn: 800,
  weight_threshold_crit: 950,
  sound_enabled: true,
  auto_refresh: 1,
  dark_mode: true,
  alerts_enabled: true,
  esp32_max_weight_bar_kg: 35.0,
  esp32_max_strain_bridge_kg: 40.0,
};

// DOM ELEMENTS
const stressValEl = document.getElementById('stressVal');
const vibeValEl = document.getElementById('vibeVal');
const loadValEl = document.getElementById('loadVal');
const tiltValEl = document.getElementById('tiltVal');
const stressGaugeEl = document.getElementById('stressGauge');
const vibeGaugeEl = document.getElementById('vibeGauge');
const loadGaugeEl = document.getElementById('loadGauge');
const tiltGaugeEl = document.getElementById('tiltGauge');
const stressStatusEl = document.getElementById('stressStatus');
const vibeStatusEl = document.getElementById('vibeStatus');
const loadStatusEl = document.getElementById('loadStatus');
const tiltStatusEl = document.getElementById('tiltStatus');
const statusCircleEl = document.getElementById('statusCircle');
const statusTitleEl = document.getElementById('statusTitle');
const statusDescEl = document.getElementById('statusDesc');
const connStatusEl = document.getElementById('connStatus');
const esp32SystemStatusEl = document.getElementById('esp32SystemStatus');
const alertBannerEl = document.getElementById('alertBanner');
const alertTextEl = document.getElementById('alertText');
const lastSeenBadgeEl = document.getElementById('lastSeenBadge');
const lastSeenEl = document.getElementById('lastSeen');
const tareBtn = document.getElementById('tareBtn');
const loadDot = document.getElementById('loadDot');
const seedBtn = document.getElementById('seedBtn');
const timeDisplayEl = document.getElementById('timeDisplay');
const pageTitle = document.getElementById('pageTitle');

// CHARTS
let stressChart, vibeChart, stressAnalysisChart, vibeAnalysisChart;

function initCharts() {
  const stressCtx = document.getElementById('tempChart');
  if (stressCtx) {
    stressChart = new Chart(stressCtx.getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Structural Stress (%)', data: [], borderColor: '#C77DFF', backgroundColor: 'rgba(199,125,255,0.08)', tension: 0.3, fill: true }] },
      options: { responsive: true, animation: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { display: false } } }
    });
  }

  const vibeCtx = document.getElementById('vibeChart');
  if (vibeCtx) {
    vibeChart = new Chart(vibeCtx.getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Vibration', data: [], borderColor: '#00D9FF', backgroundColor: 'rgba(0,217,255,0.06)', tension: 0.3, fill: true }] },
      options: { responsive: true, animation: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { display: false } } }
    });
  }

  const stressAnalysisCtx = document.getElementById('tempAnalysisChart');
  if (stressAnalysisCtx) {
    stressAnalysisChart = new Chart(stressAnalysisCtx.getContext('2d'), { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true } });
  }

  const vibeAnalysisCtx = document.getElementById('vibeAnalysisChart');
  if (vibeAnalysisCtx) {
    vibeAnalysisChart = new Chart(vibeAnalysisCtx.getContext('2d'), { type: 'line', data: { labels: [], datasets: [] }, options: { responsive: true } });
  }
}

// UTILITY FUNCTIONS
function updateTime() {
  const now = new Date();
  const formatted = now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  timeDisplayEl.textContent = formatted;
}

function getStatus(stress, vibration, weight, tilt) {
  const s = { ...defaultSettings, ...settings };
  const crit = stress >= s.stress_threshold_crit || vibration >= s.vibration_threshold_crit || weight >= s.weight_threshold_crit;
  if (crit) return 'critical';
  const warn = stress >= s.stress_threshold_warn || vibration >= s.vibration_threshold_warn || weight >= s.weight_threshold_warn;
  return warn ? 'warning' : 'safe';
}

function updateStatusIndicator(status) {
  statusCircleEl.className = 'status-circle ' + status;
  
  if (status === 'safe') {
    statusCircleEl.textContent = 'SAFE';
    statusTitleEl.textContent = 'Bridge Status: SAFE';
    statusDescEl.textContent = 'All systems nominal. Continuous monitoring active.';
    alertBannerEl.classList.remove('show');
  } else if (status === 'warning') {
    statusCircleEl.textContent = 'WARNING';
    statusTitleEl.textContent = 'Bridge Status: WARNING';
    statusDescEl.textContent = 'Elevated stress detected. Increased monitoring recommended.';
    alertBannerEl.classList.add('show');
    alertTextEl.textContent = 'Stress levels approaching caution threshold.';
    if (settings.sound_enabled) playAlertSound(false);
  } else {
    statusCircleEl.textContent = 'CRITICAL';
    statusTitleEl.textContent = 'Bridge Status: CRITICAL';
    statusDescEl.textContent = 'Dangerous condition detected. Immediate intervention required.';
    alertBannerEl.classList.add('show');
    alertTextEl.textContent = 'CRITICAL: Structural integrity compromised. Emergency action required!';
    if (settings.sound_enabled) playAlertSound(true);
  }
}

function updateSensorStatus(value, maxWarn, maxCrit, statusEl) {
  if (!statusEl) return;
  if (value >= maxCrit) {
    statusEl.style.background = '#FF5252';
    statusEl.style.boxShadow = '0 0 12px rgba(255,82,82,0.9)';
  } else if (value >= maxWarn) {
    statusEl.style.background = '#FFC400';
    statusEl.style.boxShadow = '0 0 10px rgba(255,196,0,0.8)';
  } else {
    statusEl.style.background = '#00E676';
    statusEl.style.boxShadow = '0 0 8px rgba(0,230,118,0.6)';
  }
}

function playAlertSound(isCritical) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const freq = isCritical ? 800 : 500;
    const duration = isCritical ? 0.5 : 0.3;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function updateUI(reading) {
  if (!reading) return;
  const weight = parseFloat(reading.weight) || 0;
  const stress = parseFloat(reading.stress) || 0;
  const vibration = parseFloat(reading.vibration) || 0;
  const tilt = parseFloat(reading.tilt) || 0;

  // Update metric cards
  loadValEl.textContent = weight.toFixed(1);
  stressValEl.textContent = stress.toFixed(1);
  vibeValEl.textContent = vibration.toFixed(1);
  tiltValEl.textContent = tilt.toFixed(1);
  const lastSeenText = reading.created_at ? `Last update: ${reading.created_at}` : '--';
  if (lastSeenBadgeEl) lastSeenBadgeEl.textContent = lastSeenText;
  if (lastSeenEl) lastSeenEl.textContent = reading.created_at || '--';

  // Update gauges
  const stressPct = Math.min(100, (stress / (settings.stress_threshold_crit || defaultSettings.stress_threshold_crit)) * 100);
  const vibePct = Math.min(100, (vibration / (settings.vibration_threshold_crit || defaultSettings.vibration_threshold_crit)) * 100);
  const loadPct = Math.min(100, (weight / (settings.weight_threshold_crit || defaultSettings.weight_threshold_crit)) * 100);
  const tiltPct = Math.min(100, (Math.abs(tilt) / 18) * 100);

  stressGaugeEl.style.width = stressPct + '%';
  vibeGaugeEl.style.width = vibePct + '%';
  loadGaugeEl.style.width = loadPct + '%';
  tiltGaugeEl.style.width = tiltPct + '%';

  updateSensorStatus(stress, settings.stress_threshold_warn, settings.stress_threshold_crit, stressStatusEl);
  updateSensorStatus(vibration, settings.vibration_threshold_warn, settings.vibration_threshold_crit, vibeStatusEl);
  updateSensorStatus(weight, settings.weight_threshold_warn, settings.weight_threshold_crit, loadStatusEl);
  if (tiltStatusEl) {
    tiltStatusEl.style.background = '#00E676';
    tiltStatusEl.style.boxShadow = '0 0 8px rgba(0,230,118,0.6)';
  }

  // Bridge health
  const state = getStatus(stress, vibration, weight, tilt);
  updateStatusIndicator(state);
  updateConnectionStatus(reading.system_status || 'OFFLINE');

  const bridgeVizEl = document.getElementById('bridgeViz');
  if (bridgeVizEl) {
    bridgeVizEl.classList.toggle('bridge-critical', state === 'critical');
    bridgeVizEl.classList.remove('offline');
  }

  // Charts
  if (stressChart) {
    const label = new Date(reading.created_at).toLocaleTimeString();
    stressChart.data.labels.push(label);
    stressChart.data.datasets[0].data.push(stress);
    if (stressChart.data.labels.length > 40) { stressChart.data.labels.shift(); stressChart.data.datasets[0].data.shift(); }
    stressChart.update('none');
  }
  if (vibeChart) {
    const label = new Date(reading.created_at).toLocaleTimeString();
    vibeChart.data.labels.push(label);
    vibeChart.data.datasets[0].data.push(vibration);
    if (vibeChart.data.labels.length > 40) { vibeChart.data.labels.shift(); vibeChart.data.datasets[0].data.shift(); }
    vibeChart.update('none');
  }

  // Bridge visualization
  const cx = 50 + 300 * Math.min(1, weight / (settings.weight_threshold_crit || defaultSettings.weight_threshold_crit));
  if (loadDot) loadDot.setAttribute('cx', cx);
  const bridgeDeck = document.getElementById('bridgeDeck');
  if (bridgeDeck) {
    if (state === 'critical') { bridgeDeck.style.stroke = '#FF5252'; bridgeDeck.style.filter = 'drop-shadow(0 0 8px rgba(255,82,82,0.6))'; }
    else if (state === 'warning') { bridgeDeck.style.stroke = '#FFC400'; bridgeDeck.style.filter = 'drop-shadow(0 0 6px rgba(255,196,0,0.4))'; }
    else { bridgeDeck.style.stroke = '#00D9FF'; bridgeDeck.style.filter = 'drop-shadow(0 0 6px rgba(0,217,255,0.3))'; }
  }

  // animate gate if present
}

function clearOfflineView() {
  loadValEl.textContent = '--';
  stressValEl.textContent = '--';
  vibeValEl.textContent = '--';
  tiltValEl.textContent = '--';
  if (lastSeenBadgeEl) lastSeenBadgeEl.textContent = 'Last update: No recent data';
  if (lastSeenEl) lastSeenEl.textContent = 'No recent data';
  stressGaugeEl.style.width = '0%';
  vibeGaugeEl.style.width = '0%';
  loadGaugeEl.style.width = '0%';
  tiltGaugeEl.style.width = '0%';

  const bridgeVizEl = document.getElementById('bridgeViz');
  if (bridgeVizEl) {
    bridgeVizEl.classList.add('offline');
    bridgeVizEl.classList.remove('bridge-critical');
  }
}

// PAGE NAVIGATION
function showPage(page) {
  currentPage = page;
  
  document.querySelectorAll('[id$="Page"]').forEach(el => el.style.display = 'none');
  
  const pageEl = document.getElementById(page + 'Page');
  if (pageEl) pageEl.style.display = 'block';
  
  document.querySelectorAll('[data-page]').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  
  const titles = {
    dashboard: 'Structural Monitoring',
    analytics: 'Advanced Analytics',
    reports: 'Reports & Export',
    settings: 'System Settings'
  };
  pageTitle.textContent = titles[page] || 'Dashboard';
  
  if (page === 'analytics') loadAnalytics();
  if (page === 'reports') loadReports();
}

// ANALYTICS PAGE
function loadAnalytics() {
  const filter = currentFilter || '24h';
  fetch(`${apiBase}/analytics.php?filter=${filter}`)
    .then(r => r.json())
    .then(data => {
      displayAnalyticsStats(data.stats);
      updateAnalyticsCharts(data.data);
    })
    .catch(err => console.error('Analytics error:', err));
}

function displayAnalyticsStats(stats) {
  const grid = document.getElementById('statsGrid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Avg Stress</div>
      <div class="stat-value">${stats.stress_avg?.toFixed(1) || '--'}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Max Stress</div>
      <div class="stat-value">${stats.stress_max?.toFixed(1) || '--'}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Vibration</div>
      <div class="stat-value">${stats.vibration_avg?.toFixed(1) || '--'} Hz</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Max Vibration</div>
      <div class="stat-value">${stats.vibration_max?.toFixed(1) || '--'} Hz</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Weight</div>
      <div class="stat-value">${stats.weight_avg?.toFixed(1) || '--'} kg</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Max Weight</div>
      <div class="stat-value">${stats.weight_max?.toFixed(1) || '--'} kg</div>
    </div>
  `;
}

function updateAnalyticsCharts(data) {
  if (!stressAnalysisChart || !vibeAnalysisChart) initCharts();
  const rows = (data || []).slice().reverse();
  const times = rows.map(r => new Date(r.created_at).toLocaleTimeString());
  stressAnalysisChart.data.labels = times;
  stressAnalysisChart.data.datasets = [{ label: 'Stress (%)', data: rows.map(r => parseFloat(r.stress) || 0), borderColor: '#C77DFF', backgroundColor: 'rgba(199,125,255,0.1)', tension: 0.3, fill: true }];
  stressAnalysisChart.update();

  vibeAnalysisChart.data.labels = times;
  vibeAnalysisChart.data.datasets = [{ label: 'Vibration', data: rows.map(r => parseFloat(r.vibration) || 0), borderColor: '#00D9FF', backgroundColor: 'rgba(0,217,255,0.08)', tension: 0.3, fill: true }];
  vibeAnalysisChart.update();
}

// REPORTS PAGE
async function loadReports() {
  const reportsContent = document.getElementById('reportsContent');
  if (!reportsContent) return;
  reportsContent.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-title">Loading report history...</div></div>';

  try {
    const response = await fetch(`${apiBase}/fetch.php?filter=24h`);
    const json = await response.json();
    const rows = (json.data || []).slice().reverse();
    const total = rows.length;
    const critical = rows.filter(r => parseInt(r.critical, 10) === 1).length;
    const warnings = rows.filter(r => r.system_status === 'WARNING').length;
    const latest = rows[0];

    const historyRows = rows.slice(0, 20).map(r => `
      <tr>
        <td>${new Date(r.created_at).toLocaleString()}</td>
        <td>${parseFloat(r.weight).toFixed(1)}</td>
        <td>${parseFloat(r.stress).toFixed(1)}</td>
        <td>${parseFloat(r.tilt).toFixed(1)}</td>
        <td>${parseFloat(r.vibration).toFixed(2)}</td>
        <td>${r.system_status || 'UNKNOWN'}</td>
      </tr>
    `).join('');

    reportsContent.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Readings</div>
          <div class="stat-value">${total}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Critical Events</div>
          <div class="stat-value">${critical}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Warning States</div>
          <div class="stat-value">${warnings}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Most Recent</div>
          <div class="stat-value">${latest ? new Date(latest.created_at).toLocaleTimeString() : '--'}</div>
        </div>
      </div>
      <div class="chart-card" style="margin-top: 24px; overflow-x: auto;">
        <h5 class="chart-title">Recent Readings History</h5>
        <table class="data-table" style="width: 100%; min-width: 720px; margin-top: 16px;">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Weight (kg)</th>
              <th>Stress (%)</th>
              <th>Tilt (°)</th>
              <th>Vibration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${historyRows || '<tr><td colspan="6" style="text-align:center; color:#A0AEC0;">No readings available for the selected period.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    reportsContent.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Unable to load report history.</div><div class="empty-state-text">${err.message || 'Network or API error.'}</div></div>`;
  }
}

// SETTINGS PAGE
async function loadSettings() {
  try {
    const response = await fetch(`${apiBase}/settings.php`);
    settings = await response.json();
  } catch (err) {
    settings = { ...defaultSettings };
  }
  settings = { ...defaultSettings, ...settings };
  // map to UI sliders (HTML uses original slider ids)
  document.getElementById('flexWarnSlider').value = settings.stress_threshold_warn;
  document.getElementById('stressWarnInput').value = settings.stress_threshold_warn ?? defaultSettings.stress_threshold_warn;
  document.getElementById('flexWarnValue').textContent = settings.stress_threshold_warn ?? defaultSettings.stress_threshold_warn;
  document.getElementById('flexCritSlider').value = settings.stress_threshold_crit ?? defaultSettings.stress_threshold_crit;
  document.getElementById('stressCritInput').value = settings.stress_threshold_crit ?? defaultSettings.stress_threshold_crit;
  document.getElementById('flexCritValue').textContent = settings.stress_threshold_crit ?? defaultSettings.stress_threshold_crit;
  document.getElementById('vibeWarnSlider').value = settings.vibration_threshold_warn ?? defaultSettings.vibration_threshold_warn;
  document.getElementById('vibeWarnInput').value = settings.vibration_threshold_warn ?? defaultSettings.vibration_threshold_warn;
  document.getElementById('vibeWarnValue').textContent = settings.vibration_threshold_warn ?? defaultSettings.vibration_threshold_warn;
  document.getElementById('vibeCritSlider').value = settings.vibration_threshold_crit ?? defaultSettings.vibration_threshold_crit;
  document.getElementById('vibeCritInput').value = settings.vibration_threshold_crit ?? defaultSettings.vibration_threshold_crit;
  document.getElementById('vibeCritValue').textContent = settings.vibration_threshold_crit ?? defaultSettings.vibration_threshold_crit;
  document.getElementById('loadWarnSlider').value = settings.weight_threshold_warn ?? defaultSettings.weight_threshold_warn;
  document.getElementById('loadWarnInput').value = settings.weight_threshold_warn ?? defaultSettings.weight_threshold_warn;
  document.getElementById('loadWarnValue').textContent = settings.weight_threshold_warn ?? defaultSettings.weight_threshold_warn;
  document.getElementById('loadCritSlider').value = settings.weight_threshold_crit ?? defaultSettings.weight_threshold_crit;
  document.getElementById('loadCritInput').value = settings.weight_threshold_crit ?? defaultSettings.weight_threshold_crit;
  document.getElementById('loadCritValue').textContent = settings.weight_threshold_crit ?? defaultSettings.weight_threshold_crit;

  document.getElementById('maxWeightBarSlider').value = settings.esp32_max_weight_bar_kg ?? defaultSettings.esp32_max_weight_bar_kg;
  document.getElementById('maxWeightBarInput').value = settings.esp32_max_weight_bar_kg ?? defaultSettings.esp32_max_weight_bar_kg;
  document.getElementById('maxWeightBarValue').textContent = settings.esp32_max_weight_bar_kg ?? defaultSettings.esp32_max_weight_bar_kg;
  document.getElementById('maxStrainBridgeSlider').value = settings.esp32_max_strain_bridge_kg ?? defaultSettings.esp32_max_strain_bridge_kg;
  document.getElementById('maxStrainBridgeInput').value = settings.esp32_max_strain_bridge_kg ?? defaultSettings.esp32_max_strain_bridge_kg;
  document.getElementById('maxStrainBridgeValue').textContent = settings.esp32_max_strain_bridge_kg ?? defaultSettings.esp32_max_strain_bridge_kg;

  document.getElementById('refreshIntervalInput').value = settings.auto_refresh ?? defaultSettings.auto_refresh;
  document.getElementById('darkModeToggle').checked = settings.dark_mode ?? defaultSettings.dark_mode;
  document.getElementById('alertsEnabledToggle').checked = settings.alerts_enabled ?? defaultSettings.alerts_enabled;
  document.getElementById('soundToggle').checked = settings.sound_enabled ?? defaultSettings.sound_enabled;
}

// MODALS & INTERACTIONS
function showSensorModal(sensorName) {
  const sensorNames = {
    stress: 'Structural Stress',
    vibe: 'Vibration Intensity',
    load: 'Vehicle Weight',
    tilt: 'Tilt Angle'
  };

  const values = {
    stress: { current: stressValEl?.textContent || '--', unit: '%', status: 'Normal' },
    vibe: { current: vibeValEl?.textContent || '--', unit: 'Hz', status: 'Normal' },
    load: { current: loadValEl?.textContent || '--', unit: 'kg', status: 'Normal' },
    tilt: { current: tiltValEl?.textContent || '--', unit: '°', status: 'Normal' }
  };

  const v = values[sensorName] || { current: '--', unit: '' };
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="stat-card" style="margin-bottom: 20px;">
      <div class="stat-label">Current Value</div>
      <div class="stat-value">${v.current} ${v.unit}</div>
    </div>
    <div class="stat-card" style="margin-bottom: 20px;">
      <div class="stat-label">Status</div>
      <div class="stat-value" style="color: #00E676;">${v.status}</div>
    </div>
    <canvas id="sensorModalChart" style="max-height: 200px;"></canvas>
  `;

  if (window.Swal) {
    Swal.fire({ title: sensorNames[sensorName] || 'Sensor', html: content, showConfirmButton: true });
  }
}

function showAlertHistory() {
  fetch(`${apiBase}/alerts.php`)
    .then(r => r.json())
    .then(data => {
      const content = document.createElement('div');
      let html = '<div style="max-height: 400px; overflow-y: auto;">';
      if (!data.alerts || data.alerts.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-text">No critical alerts</div></div>';
      } else {
        data.alerts.forEach(alert => {
          html += `
            <div class="alert-item critical">
              <div><strong>${alert.type}</strong> · ${alert.message}</div>
              <div class="alert-item-time">${alert.created_at}</div>
            </div>
          `;
        });
      }
      html += '</div>';
      content.innerHTML = html;
      if (window.Swal) {
        Swal.fire({ title: 'Alert History', html: content, width: 700, showConfirmButton: false });
      }
    })
    .catch(() => {});
}

// CONNECTION STATUS
function updateConnectionStatus(status) {
  const cls = status === 'ONLINE' ? 'status-badge' : status === 'RECONNECTING' ? 'status-badge warning' : 'status-badge critical';
  connStatusEl.className = cls;
  connStatusEl.innerHTML = `<span class="status-dot"></span>ESP-32 ${status}`;
  if (esp32SystemStatusEl) esp32SystemStatusEl.textContent = status;
  if (tareBtn) tareBtn.disabled = status !== 'ONLINE';
}

async function fetchLatestReading() {
  try {
    const res = await fetch(`${apiBase}/latest.php`);
    const json = await res.json();
    if (!json) return;
    const status = json.esp32_status || (json.is_online ? 'ONLINE' : 'OFFLINE');
    updateConnectionStatus(status);
    if (json.reading) {
      updateUI(json.reading);
    } else {
      clearOfflineView();
    }
  } catch (e) {
    updateConnectionStatus('OFFLINE');
    clearOfflineView();
  }
}

function startAutoRefresh() {
  const interval = Math.max(1, settings.auto_refresh || defaultSettings.auto_refresh) * 1000;
  setInterval(fetchLatestReading, interval);
}

// EVENT LISTENERS
function setupEventListeners() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(el.dataset.page);
    });
  });
  
  document.querySelectorAll('.sensor-card').forEach(card => {
    card.addEventListener('click', () => {
      const sensor = card.dataset.sensor;
      showSensorModal(sensor);
    });
  });
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadAnalytics();
    });
  });
  
  document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    window.location.href = `${apiBase}/export_csv.php`;
    toast.success('CSV exported successfully');
  });
  
  document.getElementById('viewAlertsBtn')?.addEventListener('click', showAlertHistory);
  document.getElementById('tareBtn')?.addEventListener('click', async () => {
    try {
      const response = await fetch(`${apiBase}/tare.php`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        toast?.success && toast.success('Tare request sent');
      } else {
        toast?.error && toast.error(result.message || 'Tare request failed');
      }
    } catch (err) {
      toast?.error && toast.error('Tare request failed');
    }
  });
  
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      btn.classList.add('active');
      document.getElementById(tab + 'Tab').style.display = 'block';
    });
  });
  
  document.getElementById('flexWarnSlider')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('flexWarnValue').textContent = value;
    document.getElementById('stressWarnInput').value = value;
  });
  document.getElementById('stressWarnInput')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('flexWarnValue').textContent = value;
    document.getElementById('flexWarnSlider').value = value;
  });
  document.getElementById('flexCritSlider')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('flexCritValue').textContent = value;
    document.getElementById('stressCritInput').value = value;
  });
  document.getElementById('stressCritInput')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('flexCritValue').textContent = value;
    document.getElementById('flexCritSlider').value = value;
  });
  document.getElementById('vibeWarnSlider')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('vibeWarnValue').textContent = value;
    document.getElementById('vibeWarnInput').value = value;
  });
  document.getElementById('vibeWarnInput')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('vibeWarnValue').textContent = value;
    document.getElementById('vibeWarnSlider').value = value;
  });
  document.getElementById('vibeCritSlider')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('vibeCritValue').textContent = value;
    document.getElementById('vibeCritInput').value = value;
  });
  document.getElementById('vibeCritInput')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('vibeCritValue').textContent = value;
    document.getElementById('vibeCritSlider').value = value;
  });
  document.getElementById('loadWarnSlider')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('loadWarnValue').textContent = value;
    document.getElementById('loadWarnInput').value = value;
  });
  document.getElementById('loadWarnInput')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('loadWarnValue').textContent = value;
    document.getElementById('loadWarnSlider').value = value;
  });
  document.getElementById('loadCritSlider')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('loadCritValue').textContent = value;
    document.getElementById('loadCritInput').value = value;
  });
  document.getElementById('loadCritInput')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('loadCritValue').textContent = value;
    document.getElementById('loadCritSlider').value = value;
  });
  
  document.getElementById('maxWeightBarSlider')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('maxWeightBarValue').textContent = value;
    document.getElementById('maxWeightBarInput').value = value;
  });
  document.getElementById('maxWeightBarInput')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('maxWeightBarValue').textContent = value;
    document.getElementById('maxWeightBarSlider').value = value;
  });
  document.getElementById('maxStrainBridgeSlider')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('maxStrainBridgeValue').textContent = value;
    document.getElementById('maxStrainBridgeInput').value = value;
  });
  document.getElementById('maxStrainBridgeInput')?.addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('maxStrainBridgeValue').textContent = value;
    document.getElementById('maxStrainBridgeSlider').value = value;
  });
  
  document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
    const newSettings = {
      ...settings,
      stress_threshold_warn: parseInt(document.getElementById('stressWarnInput').value, 10),
      stress_threshold_crit: parseInt(document.getElementById('stressCritInput').value, 10),
      vibration_threshold_warn: parseInt(document.getElementById('vibeWarnInput').value, 10),
      vibration_threshold_crit: parseInt(document.getElementById('vibeCritInput').value, 10),
      weight_threshold_warn: parseInt(document.getElementById('loadWarnInput').value, 10),
      weight_threshold_crit: parseInt(document.getElementById('loadCritInput').value, 10),
      esp32_max_weight_bar_kg: parseFloat(document.getElementById('maxWeightBarInput').value),
      esp32_max_strain_bridge_kg: parseFloat(document.getElementById('maxStrainBridgeInput').value),
      auto_refresh: parseInt(document.getElementById('refreshIntervalInput').value, 10),
      dark_mode: document.getElementById('darkModeToggle').checked,
      alerts_enabled: document.getElementById('alertsEnabledToggle').checked,
      sound_enabled: document.getElementById('soundToggle').checked,
    };
    
    try {
      await fetch(`${apiBase}/settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      settings = newSettings;
      toast?.success && toast.success('Settings saved successfully');
      startAutoRefresh();
    } catch (err) {
      toast?.error && toast.error('Failed to save settings');
    }
  });
  
  seedBtn?.addEventListener('click', () => {
    fetch(`${apiBase}/insert_sample.php`)
      .then(r => r.text())
      .then(() => {
        toast.success('Sample data inserted');
      })
      .catch(err => toast.error('Failed to insert sample'));
  });
}

// INITIALIZATION
async function init() {
  updateTime();
  setInterval(updateTime, 60000);
  
  await loadSettings();
  
  initCharts();
  setupEventListeners();
  updateConnectionStatus('OFFLINE');

  // initial fetch then start periodic updates
  await fetchLatestReading();
  startAutoRefresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
