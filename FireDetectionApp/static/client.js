/* ==========================================================================
   FireWatch AI — Frontend Client Application Logic
   ========================================================================== */

let currentUser = null;
let webcamActive = false;
let analyticsCharts = {};

document.addEventListener('DOMContentLoaded', async function () {
  await checkSession();
  initNavigation();
  initAuthForms();
  initDetectWorkspaces();
  initDemoModal();
});

// ── SESSION MANAGEMENT ────────────────────────────────────────────────────────
async function checkSession() {
  try {
    const r = await fetch('/session');
    const data = await r.json();
    if (data.authenticated) {
      currentUser = { id: data.id, name: data.name, email: data.email };
      updateUserUI();
    } else {
      currentUser = null;
      updateUserUI();
    }
  } catch (err) {
    console.error('Session check failed:', err);
  }
}

function updateUserUI() {
  const userDisplay = document.getElementById('user-display-name');
  const authNav = document.getElementById('auth-nav-buttons');
  const userNav = document.getElementById('user-nav-menu');

  if (currentUser) {
    if (userDisplay) userDisplay.textContent = currentUser.name || currentUser.email;
    if (authNav) authNav.classList.add('hidden');
    if (userNav) userNav.classList.remove('hidden');
  } else {
    if (authNav) authNav.classList.remove('hidden');
    if (userNav) userNav.classList.add('hidden');
  }
}

// ── NAVIGATION & TABS ─────────────────────────────────────────────────────────
function initNavigation() {
  const tabBtns = document.querySelectorAll('.nav-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      if (tabId) switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  // Update buttons
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update panes
  document.querySelectorAll('.app-tab-pane').forEach(pane => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Trigger view data refresh
  if (tabId === 'dashboard') loadDashboardData();
  if (tabId === 'history') loadHistoryData();
  if (tabId === 'analytics') loadAnalyticsData();
  if (tabId === 'alerts') loadAlertsData();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── AUTH MODALS & FLOW ────────────────────────────────────────────────────────
function initAuthForms() {
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');

  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('signin-email').value.trim();
      const password   = document.getElementById('signin-password').value;

      try {
        const r = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier, password })
        });
        const data = await r.json();
        if (r.ok) {
          currentUser = { name: data.name };
          updateUserUI();
          closeAuthModal();
          showToast(`Welcome back, ${data.name}!`, 'success');
          switchTab('dashboard');
        } else {
          showToast(data.error || 'Login failed.', 'error');
        }
      } catch (err) {
        showToast('Connection error during sign in.', 'error');
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name     = document.getElementById('signup-name').value.trim();
      const email    = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirm  = document.getElementById('signup-confirm').value;

      if (password !== confirm) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      try {
        const r = await fetch('/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await r.json();
        if (r.ok) {
          currentUser = { name: data.name, email };
          updateUserUI();
          closeAuthModal();
          showToast('Account created successfully!', 'success');
          switchTab('dashboard');
        } else {
          showToast(data.error || 'Signup failed.', 'error');
        }
      } catch (err) {
        showToast('Connection error during sign up.', 'error');
      }
    });
  }
}

function openAuthModal(mode = 'signin') {
  const modal = document.getElementById('auth-modal');
  const signinBox = document.getElementById('signin-box');
  const signupBox = document.getElementById('signup-box');
  
  if (!modal) return;
  modal.classList.remove('hidden');

  if (mode === 'signup') {
    signinBox.classList.add('hidden');
    signupBox.classList.remove('hidden');
  } else {
    signupBox.classList.add('hidden');
    signinBox.classList.remove('hidden');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

async function handleLogout() {
  try {
    await fetch('/logout', { method: 'POST' });
    currentUser = null;
    updateUserUI();
    showToast('Logged out successfully.', 'info');
    switchTab('hero');
  } catch (err) {
    showToast('Logout failed.', 'error');
  }
}

// ── DEMO MODAL ────────────────────────────────────────────────────────────────
function initDemoModal() {
  const demoModal = document.getElementById('demo-modal');
  if (!demoModal) return;
}

function openDemoModal() {
  const modal = document.getElementById('demo-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeDemoModal() {
  const modal = document.getElementById('demo-modal');
  if (modal) modal.classList.add('hidden');
}

// ── DASHBOARD DATA ────────────────────────────────────────────────────────────
async function loadDashboardData() {
  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      const stats = await res.json();
      document.getElementById('stat-total-detections').textContent = stats.total_detections || 0;
      document.getElementById('stat-fire-detections').textContent  = stats.fire_detections || 0;
      document.getElementById('stat-smoke-detections').textContent = stats.smoke_detections || 0;
      document.getElementById('stat-alerts-sent').textContent     = stats.alerts_sent || 0;
    }

    // Load recent table
    const hRes = await fetch('/api/history');
    if (hRes.ok) {
      const history = await hRes.json();
      const tbody = document.getElementById('dashboard-recent-table');
      if (tbody) {
        if (!history || history.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary); padding: 1.5rem;">No recent detection activity recorded yet.</td></tr>`;
        } else {
          tbody.innerHTML = history.slice(0, 5).map(item => `
            <tr>
              <td>
                <span class="badge ${item.fire_count > 0 ? 'badge-danger' : item.smoke_count > 0 ? 'badge-warning' : 'badge-neutral'}">
                  ${item.fire_count > 0 ? 'FIRE' : item.smoke_count > 0 ? 'SMOKE' : 'CLEAN'}
                </span>
              </td>
              <td>Fire: ${item.fire_count} | Smoke: ${item.smoke_count}</td>
              <td style="text-transform: capitalize;">${item.detection_type}</td>
              <td>${new Date(item.created_at).toLocaleString()}</td>
              <td>
                <span class="badge ${item.alert_status === 'sent' ? 'badge-success' : 'badge-neutral'}">
                  ${item.alert_status ? item.alert_status.toUpperCase() : 'SKIPPED'}
                </span>
              </td>
            </tr>
          `).join('');
        }
      }
    }
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

// ── DETECTION WORKSPACES (IMAGE & VIDEO) ──────────────────────────────────────
function initDetectWorkspaces() {
  const imgForm = document.getElementById('image-detect-form');
  const vidForm = document.getElementById('video-detect-form');

  if (imgForm) {
    imgForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('img-file-input');
      if (!fileInput.files || !fileInput.files[0]) {
        showToast('Please select an image file.', 'error');
        return;
      }

      const file = fileInput.files[0];
      const origPreview = document.getElementById('img-orig-preview');
      const resPreview  = document.getElementById('img-res-preview');
      const placeholder = document.getElementById('img-res-placeholder');
      const loader      = document.getElementById('img-detect-loader');
      const submitBtn   = document.getElementById('btn-img-submit');

      origPreview.src = URL.createObjectURL(file);
      origPreview.classList.remove('hidden');

      const formData = new FormData();
      formData.append('file', file);

      loader.classList.remove('hidden');
      submitBtn.disabled = true;

      try {
        const res = await fetch('/upload_image', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) throw new Error('Detection server error');

        const blob = await res.blob();
        resPreview.src = URL.createObjectURL(blob);
        resPreview.classList.remove('hidden');
        placeholder.classList.add('hidden');
        showToast('Image analyzed successfully.', 'success');
      } catch (err) {
        showToast('Failed to process image detection.', 'error');
      } finally {
        loader.classList.add('hidden');
        submitBtn.disabled = false;
      }
    });
  }

  if (vidForm) {
    vidForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('vid-file-input');
      if (!fileInput.files || !fileInput.files[0]) {
        showToast('Please select a video file.', 'error');
        return;
      }

      const file = fileInput.files[0];
      const streamContainer = document.getElementById('vid-stream-container');
      const loader = document.getElementById('vid-detect-loader');
      const submitBtn = document.getElementById('btn-vid-submit');

      const formData = new FormData();
      formData.append('file', file);

      loader.classList.remove('hidden');
      submitBtn.disabled = true;

      try {
        const res = await fetch('/upload_video', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) throw new Error('Video server error');
        const data = await res.json();

        if (data.stream_url) {
          streamContainer.innerHTML = `
            <img src="${data.stream_url}?${Date.now()}" style="width: 100%; border-radius: var(--radius-md);" alt="Video Detection Stream" />
          `;
          showToast('Video stream active.', 'success');
        }
      } catch (err) {
        showToast('Failed to start video detection.', 'error');
      } finally {
        loader.classList.add('hidden');
        submitBtn.disabled = false;
      }
    });
  }
}

// ── LIVE WEBCAM CAMERA ────────────────────────────────────────────────────────
async function startAppWebcam() {
  try {
    const res = await fetch('/webcam/start', { method: 'POST' });
    if (res.ok) {
      webcamActive = true;
      const img = document.getElementById('app-webcam-feed');
      const placeholder = document.getElementById('webcam-placeholder');
      const startBtn = document.getElementById('btn-cam-start');
      const stopBtn  = document.getElementById('btn-cam-stop');

      placeholder.classList.add('hidden');
      img.src = '/webcam_feed?' + Date.now();
      img.classList.remove('hidden');

      startBtn.disabled = true;
      stopBtn.disabled  = false;
      showToast('Live camera feed started.', 'info');
    }
  } catch (err) {
    showToast('Failed to start webcam.', 'error');
  }
}

async function stopAppWebcam() {
  try {
    const res = await fetch('/webcam/stop', { method: 'POST' });
    if (res.ok) {
      webcamActive = false;
      const img = document.getElementById('app-webcam-feed');
      const placeholder = document.getElementById('webcam-placeholder');
      const startBtn = document.getElementById('btn-cam-start');
      const stopBtn  = document.getElementById('btn-cam-stop');

      img.src = '';
      img.classList.add('hidden');
      placeholder.classList.remove('hidden');

      startBtn.disabled = false;
      stopBtn.disabled  = true;
      showToast('Live camera feed stopped.', 'info');
    }
  } catch (err) {
    showToast('Failed to stop webcam.', 'error');
  }
}

// ── HISTORY DATA ──────────────────────────────────────────────────────────────
async function loadHistoryData() {
  try {
    const res = await fetch('/api/history');
    if (res.ok) {
      const history = await res.json();
      const tbody = document.getElementById('history-table-body');
      if (!tbody) return;

      if (!history || history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary); padding: 2rem;">No detection logs available in database.</td></tr>`;
        return;
      }

      tbody.innerHTML = history.map(item => `
        <tr>
          <td>#${item.id}</td>
          <td style="text-transform: capitalize;">${item.detection_type}</td>
          <td>
            <span class="badge ${item.fire_count > 0 ? 'badge-danger' : 'badge-neutral'}">Fire: ${item.fire_count}</span>
            <span class="badge ${item.smoke_count > 0 ? 'badge-warning' : 'badge-neutral'}">Smoke: ${item.smoke_count}</span>
          </td>
          <td>${item.user_name || 'System User'}</td>
          <td>${new Date(item.created_at).toLocaleString()}</td>
          <td>
            <span class="badge ${item.alert_status === 'sent' ? 'badge-success' : 'badge-neutral'}">
              ${item.alert_status ? item.alert_status.toUpperCase() : 'SKIPPED'}
            </span>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load history:', err);
  }
}

// ── ANALYTICS DATA & CHART.JS ─────────────────────────────────────────────────
async function loadAnalyticsData() {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) return;
    const data = await res.json();

    if (typeof Chart === 'undefined') return;

    // 1. Fire vs Smoke Doughnut Chart
    const ctxRatio = document.getElementById('chart-fire-smoke');
    if (ctxRatio) {
      if (analyticsCharts.ratio) analyticsCharts.ratio.destroy();
      
      const statsRes = await fetch('/api/stats');
      const stats = statsRes.ok ? await statsRes.json() : { fire_detections: 1, smoke_detections: 1 };

      analyticsCharts.ratio = new Chart(ctxRatio, {
        type: 'doughnut',
        data: {
          labels: ['Fire Detections', 'Smoke Detections'],
          datasets: [{
            data: [stats.fire_detections || 0, stats.smoke_detections || 0],
            backgroundColor: ['#E5483E', '#F2C94C'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#F3F7F5', font: { family: 'Inter' } } }
          }
        }
      });
    }

    // 2. Detections Timeline Line Chart
    const ctxTimeline = document.getElementById('chart-timeline');
    if (ctxTimeline && data.timeline) {
      if (analyticsCharts.timeline) analyticsCharts.timeline.destroy();

      const labels = data.timeline.map(t => t.date);
      const fireData = data.timeline.map(t => t.fire || 0);
      const smokeData = data.timeline.map(t => t.smoke || 0);

      analyticsCharts.timeline = new Chart(ctxTimeline, {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ['Today'],
          datasets: [
            {
              label: 'Fire Events',
              data: fireData.length > 0 ? fireData : [0],
              borderColor: '#FF8A24',
              backgroundColor: 'rgba(255, 138, 36, 0.1)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Smoke Events',
              data: smokeData.length > 0 ? smokeData : [0],
              borderColor: '#F2C94C',
              backgroundColor: 'rgba(242, 201, 76, 0.1)',
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: '#AAB8B2' }, grid: { color: '#26352F' } },
            y: { ticks: { color: '#AAB8B2' }, grid: { color: '#26352F' } }
          },
          plugins: {
            legend: { labels: { color: '#F3F7F5', font: { family: 'Inter' } } }
          }
        }
      });
    }

  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
}

// ── ALERTS DATA ───────────────────────────────────────────────────────────────
async function loadAlertsData() {
  try {
    const res = await fetch('/api/alerts');
    if (res.ok) {
      const alerts = await res.json();
      const tbody = document.getElementById('alerts-table-body');
      if (!tbody) return;

      if (!alerts || alerts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-secondary); padding: 2rem;">No Telegram alert logs found.</td></tr>`;
        return;
      }

      tbody.innerHTML = alerts.map(a => `
        <tr>
          <td>#${a.id}</td>
          <td>
            <span class="badge ${a.status === 'sent' ? 'badge-success' : a.status === 'failed' ? 'badge-danger' : 'badge-neutral'}">
              ${a.status.toUpperCase()}
            </span>
          </td>
          <td style="text-transform: capitalize;">${a.alert_type || 'Telegram'}</td>
          <td>${a.message || 'Fire detected notification'}</td>
          <td>${a.detection_type ? a.detection_type.toUpperCase() : 'N/A'}</td>
          <td>${new Date(a.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load alerts:', err);
  }
}

// ── TOAST NOTIFICATIONS ───────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  
  const bg = type === 'success' ? '#43B581' : type === 'error' ? '#E5483E' : '#2F8F5B';

  toast.style.cssText = `
    background: ${bg};
    color: #ffffff;
    padding: 12px 18px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    animation: fadeIn 0.2s ease-out;
  `;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function createToastContainer() {
  const c = document.createElement('div');
  c.id = 'toast-container';
  c.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  document.body.appendChild(c);
  return c;
}
