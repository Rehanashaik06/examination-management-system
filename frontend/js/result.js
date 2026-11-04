import { requireStudent, logout } from './exam-config.js';

const student = requireStudent();
const RESULT_KEY = 'oes_exam_result';
const page = document.getElementById('resultPage');
document.getElementById('logoutBtn').addEventListener('click', logout);

const raw = sessionStorage.getItem(RESULT_KEY);
if (!raw) {
  page.innerHTML = `
    <div class="result-card" style="text-align:center;">
      <h1>No result available</h1>
      <p style="color: var(--neutral-500);">You have not submitted an examination yet.</p>
      <div class="result-actions" style="margin-top:1.5rem;">
        <a href="/dashboard.html" class="btn btn-primary">Back to Dashboard</a>
      </div>
    </div>`;
} else {
  const r = JSON.parse(raw);
  renderResult(r);
}

function renderResult(r) {
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (Math.max(r.percentage, 0) / 100) * circumference;

  page.innerHTML = `
    <div class="result-card">
      <div class="result-banner">
        <div class="check-icon">✓</div>
        <h1>Examination Completed</h1>
        <p>${r.examTitle}</p>
        ${r.autoSubmitted ? '<span class="auto-note">Auto-submitted (time ended)</span>' : ''}
      </div>

      <div class="score-ring-wrap">
        <div class="score-ring">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#1d4ed8" />
                <stop offset="100%" stop-color="#0ea5e9" />
              </linearGradient>
            </defs>
            <circle class="track" cx="90" cy="90" r="80" />
            <circle class="progress" cx="90" cy="90" r="80"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}" />
          </svg>
          <div class="score-text">
            <span class="score-pct">${r.percentage}%</span>
            <span class="score-marks">${r.marks} / ${r.maxMarks} marks</span>
          </div>
        </div>
      </div>

      <div class="result-grid">
        <div class="result-tile"><div class="rt-label">Total Questions</div><div class="rt-value">${r.totalQuestions}</div></div>
        <div class="result-tile"><div class="rt-label">Attempted</div><div class="rt-value">${r.attempted}</div></div>
        <div class="result-tile correct"><div class="rt-label">Correct</div><div class="rt-value">${r.correct}</div></div>
        <div class="result-tile incorrect"><div class="rt-label">Incorrect</div><div class="rt-value">${r.incorrect}</div></div>
        <div class="result-tile unattempted"><div class="rt-label">Unanswered</div><div class="rt-value">${r.unattempted}</div></div>
        <div class="result-tile"><div class="rt-label">Total Marks</div><div class="rt-value">${r.marks}</div></div>
      </div>

      <div class="result-meta">
        <div class="meta-row"><span class="mr-label">Student ID</span><span class="mr-value">${r.studentId}</span></div>
        <div class="meta-row"><span class="mr-label">Examination</span><span class="mr-value">${r.examTitle}</span></div>
        <div class="meta-row"><span class="mr-label">Score Percentage</span><span class="mr-value">${r.percentage}%</span></div>
        <div class="meta-row"><span class="mr-label">Maximum Marks</span><span class="mr-value">${r.maxMarks}</span></div>
      </div>

      <div class="result-actions">
        <a href="/dashboard.html" class="btn btn-primary">Back to Dashboard</a>
        <button id="logoutBtn2" class="btn btn-secondary">Logout</button>
      </div>
    </div>`;

  document.getElementById('logoutBtn2').addEventListener('click', logout);

  // Clean up the stored result after display
  sessionStorage.removeItem(RESULT_KEY);
}
