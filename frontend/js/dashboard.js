import { EXAMS, requireStudent, logout } from './exam-config.js';

const student = requireStudent();
if (student) {
  document.getElementById('studentName').textContent = student.id;
  document.getElementById('studentIdValue').textContent = student.id;
}

const grid = document.getElementById('examGrid');

function renderCards() {
  grid.innerHTML = EXAMS.map((exam) => `
    <article class="exam-card">
      <div class="exam-card-head">
        <h3 class="exam-card-title">${exam.title}</h3>
        <span class="exam-badge">${exam.type}</span>
      </div>
      <ul class="exam-meta">
        <li><span class="meta-label">Questions</span><span class="meta-value">${exam.totalQuestions}</span></li>
        <li><span class="meta-label">Duration</span><span class="meta-value">${exam.durationMinutes} min</span></li>
        <li><span class="meta-label">Total Marks</span><span class="meta-value">${exam.totalMarks}</span></li>
        <li><span class="meta-label">Correct</span><span class="meta-value">+${exam.correctMark}</span></li>
        <li><span class="meta-label">Negative</span><span class="meta-value">${exam.negativeMark > 0 ? '-' + exam.negativeMark : 'No'}</span></li>
        <li><span class="meta-label">Type</span><span class="meta-value">MCQ</span></li>
      </ul>
      <button class="btn btn-primary" data-exam-id="${exam.id}">Start Exam</button>
    </article>
  `).join('');

  grid.querySelectorAll('[data-exam-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-exam-id');
      sessionStorage.setItem('oes_active_exam', id);
      window.location.href = '/instructions.html';
    });
  });
}

document.getElementById('logoutBtn').addEventListener('click', logout);

renderCards();
