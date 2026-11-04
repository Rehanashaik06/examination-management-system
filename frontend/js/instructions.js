import { getExamById, requireStudent } from './exam-config.js';

requireStudent();
const examId = sessionStorage.getItem('oes_active_exam');
const exam = getExamById(examId);
if (!exam) {
  window.location.href = '/dashboard.html';
} else {
  document.getElementById('examTitle').textContent = exam.title;
  document.getElementById('examType').textContent = exam.type;

  const summary = document.getElementById('instrSummary');
  summary.innerHTML = `
    <div class="summary-tile"><div class="tile-label">Questions</div><div class="tile-value">${exam.totalQuestions}</div></div>
    <div class="summary-tile"><div class="tile-label">Duration</div><div class="tile-value">${exam.durationMinutes} min</div></div>
    <div class="summary-tile"><div class="tile-label">Total Marks</div><div class="tile-value">${exam.totalMarks}</div></div>
    <div class="summary-tile"><div class="tile-label">Correct</div><div class="tile-value">+${exam.correctMark}</div></div>
    <div class="summary-tile"><div class="tile-label">Negative</div><div class="tile-value">${exam.negativeMark > 0 ? '-' + exam.negativeMark : '0'}</div></div>
  `;

  const marking = document.getElementById('markingScheme');
  marking.innerHTML = `
    <li>Each correct answer awards <strong>+${exam.correctMark} mark${exam.correctMark > 1 ? 's' : ''}</strong>.</li>
    <li>Each incorrect answer deducts <strong>${exam.negativeMark > 0 ? exam.negativeMark + ' mark(s)' : 'no marks'}</strong>.</li>
    <li>Unanswered questions award <strong>0 marks</strong>.</li>
  `;

  document.getElementById('startTestBtn').addEventListener('click', () => {
    sessionStorage.setItem('oes_active_exam', exam.id);
    window.location.href = '/exam.html';
  });
}
