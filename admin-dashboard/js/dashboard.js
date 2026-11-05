/* ===========================
   Dashboard Page JS
   =========================== */

const dashboardExams = [
  { id: 1, name: 'Data Structures', subject: 'Computer Science', questions: 40, students: 186, date: '2026-11-05', status: 'published' },
  { id: 2, name: 'Machine Learning', subject: 'Computer Science', questions: 35, students: 142, date: '2026-11-04', status: 'published' },
  { id: 3, name: 'Operating Systems', subject: 'Computer Science', questions: 50, students: 98, date: '2026-11-03', status: 'draft' },
  { id: 4, name: 'Database Management', subject: 'Computer Science', questions: 45, students: 175, date: '2026-11-02', status: 'published' },
];

const recentActivities = [
  { icon: '📝', bg: 'var(--primary-light)', color: 'var(--primary)', text: 'New exam "Database Management" created', time: '2 hours ago' },
  { icon: '❓', bg: 'var(--info-light)', color: 'var(--info)', text: '15 questions added to "Data Structures"', time: '5 hours ago' },
  { icon: '👨\u200d🎓', bg: 'var(--success-light)', color: 'var(--success)', text: 'New student "Priya Sharma" registered', time: '1 day ago' },
  { icon: '✅', bg: 'var(--success-light)', color: 'var(--success)', text: 'Exam "Machine Learning" published', time: '1 day ago' },
  { icon: '📊', bg: 'var(--warning-light)', color: 'var(--warning)', text: 'Results generated for "Operating Systems"', time: '2 days ago' },
  { icon: '📝', bg: 'var(--primary-light)', color: 'var(--primary)', text: 'Exam "Operating Systems" saved as draft', time: '3 days ago' },
];

function renderRecentExams() {
  const tbody = document.getElementById('recentExamsBody');
  if (!tbody) return;

  tbody.innerHTML = dashboardExams
    .map(
      (e) => `
      <tr>
        <td class="cell-strong">${e.name}</td>
        <td>${e.questions}</td>
        <td>${e.students}</td>
        <td class="cell-muted">${formatDate(e.date)}</td>
        <td><span class="badge ${e.status === 'published' ? 'badge-success' : 'badge-warning'}">
          ${e.status === 'published' ? '✅ Published' : '✏️ Draft'}
        </span></td>
        <td>
          <div class="action-btns">
            <a href="exams.html" class="action-btn edit" title="Edit">✏️</a>
            <a href="exams.html" class="action-btn view" title="View">👁️</a>
            <a href="exams.html" class="action-btn delete" title="Delete">🗑️</a>
          </div>
        </td>
      </tr>`
    )
    .join('');
}

function renderRecentActivity() {
  const container = document.getElementById('recentActivity');
  if (!container) return;

  container.innerHTML = recentActivities
    .map(
      (a) => `
      <div class="activity-item">
        <div class="activity-icon" style="background:${a.bg};color:${a.color}">${a.icon}</div>
        <div>
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${a.time}</div>
        </div>
      </div>`
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderRecentExams();
  renderRecentActivity();
});
