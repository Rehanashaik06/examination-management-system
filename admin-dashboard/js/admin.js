/* ===========================
   Exam Portal - Shared JS
   Sidebar, Toasts, Confirm, Utils
   =========================== */

// ---------- Sidebar HTML (shared across all pages) ----------
const SIDEBAR_PAGES = [
  { href: 'dashboard.html', icon: '📊', label: 'Dashboard', key: 'dashboard' },
  { href: 'exams.html', icon: '📚', label: 'Exams', key: 'exams' },
  { href: 'questions.html', icon: '❓', label: 'Questions', key: 'questions' },
  { href: 'students.html', icon: '👨\u200d🎓', label: 'Students', key: 'students' },
  { href: 'results.html', icon: '📈', label: 'Results', key: 'results' },
  { href: 'settings.html', icon: '⚙️', label: 'Settings', key: 'settings' },
];

function buildSidebar(activeKey) {
  const navItems = SIDEBAR_PAGES.map(
    (p) => `
      <a href="${p.href}" class="nav-item ${p.key === activeKey ? 'active' : ''}">
        <span class="nav-icon">${p.icon}</span>
        <span>${p.label}</span>
      </a>`
  ).join('');

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">📝 Exam Portal</div>
        <div class="sidebar-subtitle">Admin Panel</div>
      </div>
      <nav class="sidebar-nav">
        ${navItems}
      </nav>
      <div class="sidebar-footer">
        <a href="index.html" class="logout-btn">
          <span>🚪</span>
          <span>Logout</span>
        </a>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle menu">☰</button>
  `;
}

// Inject sidebar into any page with a #sidebar-root element
function initSidebar(activeKey) {
  const root = document.getElementById('sidebar-root');
  if (!root) return;
  root.innerHTML = buildSidebar(activeKey);

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('sidebarToggle');

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }
}

// ---------- Toast Notifications ----------
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---------- Confirm Dialog ----------
function showConfirm(title, subtitle, onConfirm) {
  let overlay = document.getElementById('confirmOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.id = 'confirmOverlay';
    overlay.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-body">
          <div class="confirm-icon">🗑️</div>
          <div class="confirm-text" id="confirmText"></div>
          <div class="confirm-sub" id="confirmSub"></div>
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
          <button class="btn btn-danger" id="confirmOk">Delete</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  document.getElementById('confirmText').textContent = title;
  document.getElementById('confirmSub').textContent = subtitle;
  overlay.classList.add('active');

  const ok = document.getElementById('confirmOk');
  const cancel = document.getElementById('confirmCancel');

  const close = () => {
    overlay.classList.remove('active');
    ok.removeEventListener('click', onOk);
    cancel.removeEventListener('click', close);
  };
  const onOk = () => {
    close();
    onConfirm();
  };

  ok.addEventListener('click', onOk);
  cancel.addEventListener('click', close);
}

// ---------- Modal Helpers ----------
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
  }
});

// ---------- Form Validation Helpers ----------
function validateField(input, errorId, message) {
  const errorEl = document.getElementById(errorId);
  if (!input.value.trim()) {
    input.classList.add('invalid');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('active');
    }
    return false;
  }
  input.classList.remove('invalid');
  if (errorEl) errorEl.classList.remove('active');
  return true;
}

function clearFormErrors(form) {
  form.querySelectorAll('.form-error').forEach((e) => e.classList.remove('active'));
  form.querySelectorAll('.invalid').forEach((e) => e.classList.remove('invalid'));
}

function resetForm(form) {
  form.reset();
  clearFormErrors(form);
}

// ---------- Empty State Helper ----------
function renderEmptyState(colspan, message, sub) {
  return `
    <tr>
      <td colspan="${colspan}">
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">${message}</div>
          <div class="empty-state-sub">${sub}</div>
        </div>
      </td>
    </tr>`;
}

// ---------- Date Format ----------
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---------- Stats Updater ----------
function updateStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ---------- Data Store (structured for future API replacement) ----------
const Store = {
  exams: [],
  questions: [],
  students: [],
  results: [],
};

// ---------- App Init ----------
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar auto-init via data-active attribute
  const root = document.getElementById('sidebar-root');
  if (root) {
    const activeKey = root.getAttribute('data-active') || '';
    initSidebar(activeKey);
  }
});
