const basePath = window.location.pathname.replace(/\/(index\.php)?$/, '');
const apiBase = basePath + '/src/api';

// STATE & CONFIG
let currentPage = 'dashboard';
let currentFilter = '24h';
let isConnected = false;
let lastId = 0;
let settings = {};

const defaultThresholds = {
  flex_threshold_warn: 30,
  flex_threshold_crit: 40,
  vibe_threshold_warn: 10,
  vibe_threshold_crit: 12,
  load_threshold_warn: 800,
  load_threshold_crit: 950,
  sound_enabled: true,
  auto_refresh: 2,
  dark_mode: true,
  alerts_enabled: true,
};

// DOM ELEMENTS
const flexValEl = document.getElementById('flexVal');
const vibeValEl = document.getElementById('vibeVal');
const loadValEl = document.getElementById('loadVal');
const flexGaugeEl = document.getElementById('flexGauge');
const vibeGaugeEl = document.getElementById('vibeGauge');
const loadGaugeEl = document.getElementById('loadGauge');
const flexStatusEl = document.getElementById('flexStatus');
const vibeStatusEl = document.getElementById('vibeStatus');
const loadStatusEl = document.getElementById('loadStatus');
const statusCircleEl = document.getElementById('statusCircle');
const statusTitleEl = document.getElementById('statusTitle');
const statusDescEl = document.getElementById('statusDesc');
const connStatusEl = document.getElementById('connStatus');
const alertBannerEl = document.getElementById('alertBanner');
const alertTextEl = document.getElementById('alertText');
const loadDot = document.getElementById('loadDot');
const seedBtn = document.getElementById('seedBtn');
const timeDisplayEl = document.getElementById('timeDisplay');
const pageTitle = document.getElementById('pageTitle');

// CHARTS
let tempChart, vibeChart, tempAnalysisChart, vibeAnalysisChart;

function initCharts() {
  const tempCtx = document.getElementById('tempChart');
  if (tempCtx) {
    tempChart = new Chart(tempCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Temperature (°C)',
          data: [],
          borderColor: '#C77DFF',
          backgroundColor: 'rgba(199, 125, 255, 0.05)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#00D9FF',
        }]
      },
      options: {
        responsive: true,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { display: false, beginAtZero: true },
          x: { display: false }
        }
      }
    });
  }

  const vibeCtx = document.getElementById('vibeChart');
  if (vibeCtx) {
    vibeChart = new Chart(vibeCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Vibration (Hz)',
          data: [],
          borderColor: '#00D9FF',
          backgroundColor: 'rgba(0, 217, 255, 0.05)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#C77DFF',
        }]
      },
      options: {
        responsive: true,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { display: false, beginAtZero: true },
          x: { display: false }
        }
      }
    });
  }

  const tempAnalysisCtx = document.getElementById('tempAnalysisChart');
  if (tempAnalysisCtx) {
    tempAnalysisChart = new Chart(tempAnalysisCtx.getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        animation: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  const vibeAnalysisCtx = document.getElementById('vibeAnalysisChart');
  if (vibeAnalysisCtx) {
    vibeAnalysisChart = new Chart(vibeAnalysisCtx.getContext('2d'), {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        animation: true,
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } }
      }
    });
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

function getStatus(flex, vibe, load) {
  const s = settings;
  const flexCrit = flex > s.flex_threshold_crit;
  const vibeCrit = vibe > s.vibe_threshold_crit;
  const loadCrit = load > s.load_threshold_crit;
  
  if (flexCrit || vibeCrit || loadCrit) return 'critical';
  
  const flexWarn = flex > s.flex_threshold_warn;
  const vibeWarn = vibe > s.vibe_threshold_warn;
  const loadWarn = load > s.load_threshold_warn;
  
  if (flexWarn || vibeWarn || loadWarn) return 'warning';
  
  return 'safe';
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
  if (value > maxCrit) {
    statusEl.style.background = '#FF5252';
    statusEl.style.boxShadow = '0 0 10px rgba(255, 82, 82, 0.8)';
  } else if (value > maxWarn) {
    statusEl.style.background = '#FFC400';
    statusEl.style.boxShadow = '0 0 10px rgba(255, 196, 0, 0.8)';
  } else {
    statusEl.style.background = '#00E676';
    statusEl.style.boxShadow = '0 0 10px rgba(0, 230, 118, 0.6)';
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
  const d = JSON.parse(reading.data);
  
  const flex = parseFloat(d.bridge_temp) || 0;
  const vibe = parseFloat(d.vibration) || 0;
  const load = parseFloat(d.load) || 0;
  
  flexValEl.textContent = flex.toFixed(1);
  vibeValEl.textContent = vibe.toFixed(1);
  loadValEl.textContent = load.toFixed(1);
  
  const flexPct = Math.min(100, (flex / settings.flex_threshold_crit * 0.8) * 100);
  const vibePct = Math.min(100, (vibe / settings.vibe_threshold_crit * 0.8) * 100);
  const loadPct = Math.min(100, (load / settings.load_threshold_crit * 0.8) * 100);
  
  flexGaugeEl.style.width = flexPct + '%';
  vibeGaugeEl.style.width = vibePct + '%';
  loadGaugeEl.style.width = loadPct + '%';
  
  updateSensorStatus(flex, settings.flex_threshold_warn, settings.flex_threshold_crit, flexStatusEl);
  updateSensorStatus(vibe, settings.vibe_threshold_warn, settings.vibe_threshold_crit, vibeStatusEl);
  updateSensorStatus(load, settings.load_threshold_warn, settings.load_threshold_crit, loadStatusEl);
  
  const status = getStatus(flex, vibe, load);
  updateStatusIndicator(status);
  
  if (tempChart) {
    const ts = new Date(reading.ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    tempChart.data.labels.push(ts);
    tempChart.data.datasets[0].data.push(flex);
    vibeChart.data.labels.push(ts);
    vibeChart.data.datasets[0].data.push(vibe);
    
    if (tempChart.data.labels.length > 20) {
      tempChart.data.labels.shift();
      tempChart.data.datasets[0].data.shift();
      vibeChart.data.labels.shift();
      vibeChart.data.datasets[0].data.shift();
    }
    
    tempChart.update();
    vibeChart.update();
  }
  
  const loadPctNorm = Math.min(1, load / settings.load_threshold_crit);
  const cx = 50 + 300 * loadPctNorm;
  loadDot.setAttribute('cx', cx);
  
  const bridgeDeck = document.getElementById('bridgeDeck');
  if (status === 'critical') {
    bridgeDeck.style.stroke = '#FF5252';
    bridgeDeck.style.filter = 'drop-shadow(0 0 8px rgba(255,82,82,0.6))';
  } else if (status === 'warning') {
    bridgeDeck.style.stroke = '#FFC400';
    bridgeDeck.style.filter = 'drop-shadow(0 0 6px rgba(255,196,0,0.4))';
  } else {
    bridgeDeck.style.stroke = '#00D9FF';
    bridgeDeck.style.filter = 'drop-shadow(0 0 6px rgba(0,217,255,0.3))';
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
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Avg Temperature</div>
      <div class="stat-value">${stats.temp_avg?.toFixed(1) || '--'}°C</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Max Temperature</div>
      <div class="stat-value">${stats.temp_max?.toFixed(1) || '--'}°C</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Vibration</div>
      <div class="stat-value">${stats.vibe_avg?.toFixed(1) || '--'} Hz</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Max Vibration</div>
      <div class="stat-value">${stats.vibe_max?.toFixed(1) || '--'} Hz</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Load</div>
      <div class="stat-value">${stats.load_avg?.toFixed(0) || '--'} kg</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Max Load</div>
      <div class="stat-value">${stats.load_max?.toFixed(0) || '--'} kg</div>
    </div>
  `;
}

function updateAnalyticsCharts(data) {
  if (!tempAnalysisChart) initCharts();
  
  const temps = data.map(r => parseFloat(JSON.parse(r.data).bridge_temp) || 0).slice().reverse();
  const times = data.map(r => new Date(r.ts * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })).slice().reverse();
  
  tempAnalysisChart.data.labels = times;
  tempAnalysisChart.data.datasets = [{
    label: 'Temperature (°C)',
    data: temps,
    borderColor: '#C77DFF',
    backgroundColor: 'rgba(199, 125, 255, 0.1)',
    tension: 0.4,
    fill: true
  }];
  tempAnalysisChart.update();
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
    settings = defaultThresholds;
  }
  
  document.getElementById('flexWarnSlider').value = settings.flex_threshold_warn;
  document.getElementById('flexWarnValue').textContent = settings.flex_threshold_warn;
  document.getElementById('flexCritSlider').value = settings.flex_threshold_crit;
  document.getElementById('flexCritValue').textContent = settings.flex_threshold_crit;
  document.getElementById('vibeWarnSlider').value = settings.vibe_threshold_warn;
  document.getElementById('vibeWarnValue').textContent = settings.vibe_threshold_warn;
  document.getElementById('vibeCritSlider').value = settings.vibe_threshold_crit;
  document.getElementById('vibeCritValue').textContent = settings.vibe_threshold_crit;
  document.getElementById('loadWarnSlider').value = settings.load_threshold_warn;
  document.getElementById('loadWarnValue').textContent = settings.load_threshold_warn;
  document.getElementById('loadCritSlider').value = settings.load_threshold_crit;
  document.getElementById('loadCritValue').textContent = settings.load_threshold_crit;
  
  document.getElementById('refreshIntervalInput').value = settings.auto_refresh;
  document.getElementById('darkModeToggle').checked = settings.dark_mode;
  document.getElementById('alertsEnabledToggle').checked = settings.alerts_enabled;
  document.getElementById('soundToggle').checked = settings.sound_enabled;
}

// MODALS & INTERACTIONS
function showSensorModal(sensorName) {
  const sensorNames = {
    flex: 'Flex Sensor',
    vibe: 'Vibration Sensor',
    load: 'Load Weight Sensor'
  };
  
  const values = {
    flex: { current: flexValEl.textContent, unit: 'mm strain', status: 'Normal' },
    vibe: { current: vibeValEl.textContent, unit: 'Hz', status: 'Normal' },
    load: { current: loadValEl.textContent, unit: 'kg', status: 'Normal' }
  };
  
  const v = values[sensorName];
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
  
  const modal = new Modal(sensorNames[sensorName] + ' Details', content, {
    buttons: [
      { text: 'Close', type: 'secondary', action: () => modal.close() }
    ]
  });
  
  modal.show();
}

function showAlertHistory() {
  fetch(`${apiBase}/alerts.php`)
    .then(r => r.json())
    .then(data => {
      const content = document.createElement('div');
      let html = '<div style="max-height: 400px; overflow-y: auto;">';
      
      if (data.alerts.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-text">No critical alerts</div></div>';
      } else {
        data.alerts.forEach(alert => {
          html += `
            <div class="alert-item critical">
              <div>
                <strong>${alert.data.bridge_temp}°C</strong> | 
                <strong>${alert.data.vibration} Hz</strong> | 
                <strong>${alert.data.load} kg</strong>
              </div>
              <div class="alert-item-time">${alert.timestamp}</div>
            </div>
          `;
        });
      }
      
      html += '</div>';
      content.innerHTML = html;
      
      const modal = new Modal('Alert History', content, {
        buttons: [{ text: 'Close', type: 'secondary', action: () => modal.close() }]
      });
      modal.show();
    });
}

// CONNECTION STATUS
function updateConnStatus(connected) {
  isConnected = connected;
  if (connected) {
    connStatusEl.className = 'status-badge';
    connStatusEl.innerHTML = '<span class="status-dot"></span>ESP-32 Connected';
  } else {
    connStatusEl.className = 'status-badge warning';
    connStatusEl.innerHTML = '<span class="status-dot"></span>Reconnecting...';
  }
}

// SSE CONNECTION
function connectSSE() {
  const sse = new EventSource(`${apiBase}/stream.php?last_id=${lastId}`);
  
  sse.addEventListener('reading', (e) => {
    const row = JSON.parse(e.data);
    lastId = row.id;
    updateUI(row);
    updateConnStatus(true);
  });
  
  sse.addEventListener('error', () => {
    updateConnStatus(false);
    sse.close();
    setTimeout(connectSSE, 3000);
  });
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
      flex_threshold_warn: parseInt(document.getElementById('flexWarnSlider').value),
      flex_threshold_crit: parseInt(document.getElementById('flexCritSlider').value),
      vibe_threshold_warn: parseInt(document.getElementById('vibeWarnSlider').value),
      vibe_threshold_crit: parseInt(document.getElementById('vibeCritSlider').value),
      load_threshold_warn: parseInt(document.getElementById('loadWarnSlider').value),
      load_threshold_crit: parseInt(document.getElementById('loadCritSlider').value),
      auto_refresh: parseInt(document.getElementById('refreshIntervalInput').value),
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
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
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
  updateConnStatus(false);
  
  setTimeout(() => connectSSE(), 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
