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
  tilt_threshold_warn: 8,
  tilt_threshold_crit: 12,
  weight_threshold_warn: 800,
  weight_threshold_crit: 950,
  sound_enabled: true,
  auto_refresh: 1,
  dark_mode: true,
  alerts_enabled: true,
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
const gateStatusEl = document.getElementById('gateStatus');
const alertBannerEl = document.getElementById('alertBanner');
const alertTextEl = document.getElementById('alertText');
const lastSeenEl = document.getElementById('lastSeen');
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
  const s = settings;
  const crit = stress >= s.stress_threshold_crit || vibration >= s.vibration_threshold_crit || Math.abs(tilt) >= s.tilt_threshold_crit || weight >= s.weight_threshold_crit;
  if (crit) return 'critical';
  const warn = stress >= s.stress_threshold_warn || vibration >= s.vibration_threshold_warn || Math.abs(tilt) >= s.tilt_threshold_warn || weight >= s.weight_threshold_warn;
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
  gateStatusEl.textContent = reading.gate_status || 'UNKNOWN';
  lastSeenEl.textContent = reading.created_at || '';

  // Update gauges
  const stressPct = Math.min(100, (stress / (settings.stress_threshold_crit || defaultSettings.stress_threshold_crit)) * 100);
  const vibePct = Math.min(100, (vibration / (settings.vibration_threshold_crit || defaultSettings.vibration_threshold_crit)) * 100);
  const loadPct = Math.min(100, (weight / (settings.weight_threshold_crit || defaultSettings.weight_threshold_crit)) * 100);
  const tiltPct = Math.min(100, (Math.abs(tilt) / (settings.tilt_threshold_crit || defaultSettings.tilt_threshold_crit)) * 100);

  stressGaugeEl.style.width = stressPct + '%';
  vibeGaugeEl.style.width = vibePct + '%';
  loadGaugeEl.style.width = loadPct + '%';
  tiltGaugeEl.style.width = tiltPct + '%';

  updateSensorStatus(stress, settings.stress_threshold_warn, settings.stress_threshold_crit, stressStatusEl);
  updateSensorStatus(vibration, settings.vibration_threshold_warn, settings.vibration_threshold_crit, vibeStatusEl);
  updateSensorStatus(weight, settings.weight_threshold_warn, settings.weight_threshold_crit, loadStatusEl);
  updateSensorStatus(Math.abs(tilt), settings.tilt_threshold_warn, settings.tilt_threshold_crit, tiltStatusEl);

  // Bridge health
  const state = getStatus(stress, vibration, weight, tilt);
  updateStatusIndicator(state);
  updateConnectionStatus(reading.system_status || 'OFFLINE');

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
  loadDot.setAttribute('cx', cx);
  const bridgeDeck = document.getElementById('bridgeDeck');
  if (state === 'critical') { bridgeDeck.style.stroke = '#FF5252'; bridgeDeck.style.filter = 'drop-shadow(0 0 8px rgba(255,82,82,0.6))'; }
  else if (state === 'warning') { bridgeDeck.style.stroke = '#FFC400'; bridgeDeck.style.filter = 'drop-shadow(0 0 6px rgba(255,196,0,0.4))'; }
  else { bridgeDeck.style.stroke = '#00D9FF'; bridgeDeck.style.filter = 'drop-shadow(0 0 6px rgba(0,217,255,0.3))'; }

  // animate gate if present
  animateGate(reading.gate_status || 'CLOSED');
}

function animateGate(status) {
  const gate = document.getElementById('gateArm');
  if (!gate) return;
  if (status.toUpperCase() === 'OPEN') {
    gate.style.transition = 'transform 600ms ease';
    gate.style.transform = 'rotate(-45deg)';
  } else {
    gate.style.transition = 'transform 600ms ease';
    gate.style.transform = 'rotate(0deg)';
  }
  gateStatusEl.textContent = status;
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
function loadReports() {
  const reportsContent = document.getElementById('reportsContent');
  reportsContent.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Readings</div>
        <div class="stat-value">1,250</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Critical Events</div>
        <div class="stat-value">12</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Warnings</div>
        <div class="stat-value">45</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Uptime</div>
        <div class="stat-value">99.8%</div>
      </div>
    </div>
  `;
}

// SETTINGS PAGE
async function loadSettings() {
  try {
    const response = await fetch(`${apiBase}/settings.php`);
    settings = await response.json();
  } catch (err) {
    settings = defaultSettings;
  }
  // map to UI sliders (HTML uses original slider ids)
  document.getElementById('flexWarnSlider').value = settings.stress_threshold_warn ?? defaultSettings.stress_threshold_warn;
  document.getElementById('flexWarnValue').textContent = settings.stress_threshold_warn ?? defaultSettings.stress_threshold_warn;
  document.getElementById('flexCritSlider').value = settings.stress_threshold_crit ?? defaultSettings.stress_threshold_crit;
  document.getElementById('flexCritValue').textContent = settings.stress_threshold_crit ?? defaultSettings.stress_threshold_crit;
  document.getElementById('vibeWarnSlider').value = settings.vibration_threshold_warn ?? defaultSettings.vibration_threshold_warn;
  document.getElementById('vibeWarnValue').textContent = settings.vibration_threshold_warn ?? defaultSettings.vibration_threshold_warn;
  document.getElementById('vibeCritSlider').value = settings.vibration_threshold_crit ?? defaultSettings.vibration_threshold_crit;
  document.getElementById('vibeCritValue').textContent = settings.vibration_threshold_crit ?? defaultSettings.vibration_threshold_crit;
  document.getElementById('loadWarnSlider').value = settings.weight_threshold_warn ?? defaultSettings.weight_threshold_warn;
  document.getElementById('loadWarnValue').textContent = settings.weight_threshold_warn ?? defaultSettings.weight_threshold_warn;
  document.getElementById('loadCritSlider').value = settings.weight_threshold_crit ?? defaultSettings.weight_threshold_crit;
  document.getElementById('loadCritValue').textContent = settings.weight_threshold_crit ?? defaultSettings.weight_threshold_crit;

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
}

async function fetchLatestReading() {
  try {
    const res = await fetch(`${apiBase}/latest.php`);
    const json = await res.json();
    if (!json) return;
    if (json.esp32_status) updateConnectionStatus(json.esp32_status);
    if (json.reading) updateUI(json.reading);
  } catch (e) {
    updateConnectionStatus('OFFLINE');
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
    document.getElementById('flexWarnValue').textContent = e.target.value;
  });
  document.getElementById('flexCritSlider')?.addEventListener('input', (e) => {
    document.getElementById('flexCritValue').textContent = e.target.value;
  });
  document.getElementById('vibeWarnSlider')?.addEventListener('input', (e) => {
    document.getElementById('vibeWarnValue').textContent = e.target.value;
  });
  document.getElementById('vibeCritSlider')?.addEventListener('input', (e) => {
    document.getElementById('vibeCritValue').textContent = e.target.value;
  });
  document.getElementById('loadWarnSlider')?.addEventListener('input', (e) => {
    document.getElementById('loadWarnValue').textContent = e.target.value;
  });
  document.getElementById('loadCritSlider')?.addEventListener('input', (e) => {
    document.getElementById('loadCritValue').textContent = e.target.value;
  });
  
  document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
    const newSettings = {
      ...settings,
      stress_threshold_warn: parseInt(document.getElementById('flexWarnSlider').value, 10),
      stress_threshold_crit: parseInt(document.getElementById('flexCritSlider').value, 10),
      vibration_threshold_warn: parseInt(document.getElementById('vibeWarnSlider').value, 10),
      vibration_threshold_crit: parseInt(document.getElementById('vibeCritSlider').value, 10),
      weight_threshold_warn: parseInt(document.getElementById('loadWarnSlider').value, 10),
      weight_threshold_crit: parseInt(document.getElementById('loadCritSlider').value, 10),
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
