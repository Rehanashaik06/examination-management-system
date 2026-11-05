/* ===========================
   Results Page JS
   View, Search, Filter, Delete
   =========================== */

let results = [
  { id: 1, student: 'Rahul Kumar', studentId: 'STU001', exam: 'Data Structures', dept: 'CSE', score: 82, total: 100, correct: 33, wrong: 7, date: '2026-11-05' },
  { id: 2, student: 'Priya Sharma', studentId: 'STU002', exam: 'Machine Learning', dept: 'CSE', score: 92, total: 100, correct: 37, wrong: 3, date: '2026-11-04' },
  { id: 3, student: 'Amit Singh', studentId: 'STU003', exam: 'Operating Systems', dept: 'ECE', score: 45, total: 100, correct: 18, wrong: 27, date: '2026-11-03' },
  { id: 4, student: 'Sneha Patel', studentId: 'STU004', exam: 'Database Management', dept: 'IT', score: 78, total: 100, correct: 31, wrong: 9, date: '2026-11-02' },
  { id: 5, student: 'Vikram Reddy', studentId: 'STU005', exam: 'Data Structures', dept: 'ME', score: 85, total: 100, correct: 34, wrong: 6, date: '2026-11-01' },
];

let nextResultId = 6;
const resultsTableBody = document.getElementById('resultsTableBody');

// ---------- Grade Calculation ----------
function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function isPass(percentage) {
  return percentage >= 50;
}

// ---------- Render Table ----------
function renderResults() {
  const search = document.getElementById('resultSearch').value.toLowerCase().trim();
  const fExam = document.getElementById('resultExamFilter').value;
  const fDept = document.getElementById('resultDeptFilter').value;
  const fStatus = document.getElementById('resultStatusFilter').value;

  let filtered = results.filter((r) => {
    const pct = Math.round((r.score / r.total) * 100);
    const pass = isPass(pct);
    const matchSearch =
      r.student.toLowerCase().includes(search) ||
      r.studentId.toLowerCase().includes(search) ||
      r.exam.toLowerCase().includes(search);
    const matchExam = fExam === 'all' || r.exam === fExam;
    const matchDept = fDept === 'all' || r.dept === fDept;
    const matchStatus = fStatus === 'all' || (fStatus === 'pass' && pass) || (fStatus === 'fail' && !pass);
    return matchSearch && matchExam && matchDept && matchStatus;
  });

  if (filtered.length === 0) {
    resultsTableBody.innerHTML = renderEmptyState(9, 'No results found', 'Try adjusting your search or filters.');
    return;
  }

  resultsTableBody.innerHTML = filtered
    .map((r) => {
      const pct = Math.round((r.score / r.total) * 100);
      const grade = calculateGrade(pct);
      const pass = isPass(pct);
      return `
      <tr data-id="${r.id}">
        <td class="cell-strong">${r.student}</td>
        <td class="cell-muted">${r.studentId}</td>
        <td>${r.exam}</td>
        <td>${r.score}/${r.total}</td>
        <td>${pct}%</td>
        <td><span class="badge ${grade === 'F' ? 'badge-danger' : 'badge-info'}">${grade}</span></td>
        <td><span class="badge ${pass ? 'badge-success' : 'badge-danger'}">${pass ? '✅ Pass' : '❌ Fail'}</span></td>
        <td class="cell-muted">${formatDate(r.date)}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn view" title="View" onclick="viewResult(${r.id})">👁️</button>
            <button class="action-btn" title="Download" onclick="downloadResult(${r.id})">⬇️</button>
            <button class="action-btn delete" title="Delete" onclick="deleteResult(${r.id})">🗑️</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

// ---------- Update Stats ----------
function updateResultStats() {
  const total = results.length;
  if (total === 0) {
    updateStat('resultStatTotal', '0');
    updateStat('resultStatAvg', '0%');
    updateStat('resultStatHigh', '0%');
    updateStat('resultStatPass', '0%');
    return;
  }

  const pcts = results.map((r) => Math.round((r.score / r.total) * 100));
  const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / total);
  const high = Math.max(...pcts);
  const passCount = pcts.filter((p) => p >= 50).length;
  const passPct = Math.round((passCount / total) * 100);

  updateStat('resultStatTotal', total);
  updateStat('resultStatAvg', avg + '%');
  updateStat('resultStatHigh', high + '%');
  updateStat('resultStatPass', passPct + '%');
}

// ---------- View Result Detail ----------
function viewResult(id) {
  const r = results.find((x) => x.id === id);
  if (!r) return;

  const pct = Math.round((r.score / r.total) * 100);
  const grade = calculateGrade(pct);
  const pass = isPass(pct);

  const grid = document.getElementById('resultDetailGrid');
  grid.innerHTML = `
    <div class="detail-item"><div class="detail-label">Student Name</div><div class="detail-value">${r.student}</div></div>
    <div class="detail-item"><div class="detail-label">Student ID</div><div class="detail-value">${r.studentId}</div></div>
    <div class="detail-item"><div class="detail-label">Exam</div><div class="detail-value">${r.exam}</div></div>
    <div class="detail-item"><div class="detail-label">Department</div><div class="detail-value">${r.dept}</div></div>
    <div class="detail-item"><div class="detail-label">Total Questions</div><div class="detail-value">${r.correct + r.wrong}</div></div>
    <div class="detail-item"><div class="detail-label">Correct Answers</div><div class="detail-value" style="color:var(--success)">${r.correct}</div></div>
    <div class="detail-item"><div class="detail-label">Wrong Answers</div><div class="detail-value" style="color:var(--danger)">${r.wrong}</div></div>
    <div class="detail-item"><div class="detail-label">Score</div><div class="detail-value">${r.score}/${r.total}</div></div>
    <div class="detail-item"><div class="detail-label">Percentage</div><div class="detail-value">${pct}%</div></div>
    <div class="detail-item"><div class="detail-label">Grade</div><div class="detail-value">${grade}</div></div>
    <div class="detail-item"><div class="detail-label">Result</div><div class="detail-value" style="color:${pass ? 'var(--success)' : 'var(--danger)'}">${pass ? 'Pass' : 'Fail'}</div></div>
    <div class="detail-item"><div class="detail-label">Date</div><div class="detail-value">${formatDate(r.date)}</div></div>
  `;

  openModal('resultModal');
}

// ---------- Download Result (simulated) ----------
function downloadResult(id) {
  const r = results.find((x) => x.id === id);
  if (!r) return;
  const pct = Math.round((r.score / r.total) * 100);
  const grade = calculateGrade(pct);
  const pass = isPass(pct);

  const content = `EXAM PORTAL - RESULT REPORT
============================
Student Name: ${r.student}
Student ID:   ${r.studentId}
Exam:         ${r.exam}
Department:   ${r.dept}
Date:         ${formatDate(r.date)}
----------------------------
Total Questions:  ${r.correct + r.wrong}
Correct Answers:  ${r.correct}
Wrong Answers:    ${r.wrong}
Score:            ${r.score}/${r.total}
Percentage:       ${pct}%
Grade:            ${grade}
Result:           ${pass ? 'PASS' : 'FAIL'}
============================`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `result_${r.studentId}_${r.exam.replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Result downloaded for ${r.student}.`, 'success');
}

// ---------- Delete Result ----------
function deleteResult(id) {
  const r = results.find((x) => x.id === id);
  if (!r) return;
  showConfirm(
    `Delete this result?`,
    `${r.student}'s result for "${r.exam}" will be permanently removed.`,
    () => {
      results = results.filter((x) => x.id !== id);
      renderResults();
      updateResultStats();
      showToast(`Result for ${r.student} has been deleted.`, 'success');
    }
  );
}

// ---------- Event Listeners ----------
document.getElementById('resultSearch').addEventListener('input', renderResults);
document.getElementById('resultExamFilter').addEventListener('change', renderResults);
document.getElementById('resultDeptFilter').addEventListener('change', renderResults);
document.getElementById('resultStatusFilter').addEventListener('change', renderResults);

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  renderResults();
  updateResultStats();
});
