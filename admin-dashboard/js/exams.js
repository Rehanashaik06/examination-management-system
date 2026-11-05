/* ===========================
   Exams Page JS - Full CRUD
   =========================== */

let exams = [
  { id: 1, name: 'Data Structures', subject: 'Computer Science', questions: 40, students: 186, date: '2026-11-05', status: 'published' },
  { id: 2, name: 'Machine Learning', subject: 'Computer Science', questions: 35, students: 142, date: '2026-11-04', status: 'published' },
  { id: 3, name: 'Operating Systems', subject: 'Computer Science', questions: 50, students: 98, date: '2026-11-03', status: 'draft' },
  { id: 4, name: 'Database Management', subject: 'Computer Science', questions: 45, students: 175, date: '2026-11-02', status: 'published' },
];

let nextExamId = 5;

const examTableBody = document.getElementById('examsTableBody');
const examForm = document.getElementById('examForm');

// ---------- Render Table ----------
function renderExams() {
  const search = document.getElementById('examSearch').value.toLowerCase().trim();
  const statusFilter = document.getElementById('examStatusFilter').value;

  let filtered = exams.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search) || e.subject.toLowerCase().includes(search);
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (filtered.length === 0) {
    examTableBody.innerHTML = renderEmptyState(6, 'No exams found', 'Try adjusting your search or filters.');
    return;
  }

  examTableBody.innerHTML = filtered
    .map(
      (e) => `
      <tr data-id="${e.id}">
        <td>
          <div class="cell-strong">${e.name}</div>
          <div class="cell-muted">${e.subject}</div>
        </td>
        <td>${e.questions}</td>
        <td>${e.students}</td>
        <td class="cell-muted">${formatDate(e.date)}</td>
        <td><span class="badge ${e.status === 'published' ? 'badge-success' : 'badge-warning'}">
          ${e.status === 'published' ? '✅ Published' : '✏️ Draft'}
        </span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" title="Edit" onclick="editExam(${e.id})">✏️</button>
            <button class="action-btn view" title="View" onclick="viewExam(${e.id})">👁️</button>
            <button class="action-btn delete" title="Delete" onclick="deleteExam(${e.id})">🗑️</button>
          </div>
        </td>
      </tr>`
    )
    .join('');
}

// ---------- Update Stats ----------
function updateExamStats() {
  updateStat('examStatTotal', exams.length);
  updateStat('examStatPublished', exams.filter((e) => e.status === 'published').length);
  updateStat('examStatDraft', exams.filter((e) => e.status === 'draft').length);
  updateStat('examStatAttempts', exams.reduce((sum, e) => sum + e.students, 0));
}

// ---------- Create/Edit ----------
function openCreateExam() {
  document.getElementById('examModalTitle').textContent = 'Create New Exam';
  document.getElementById('examSubmitBtn').textContent = 'Create Exam';
  document.getElementById('examEditId').value = '';
  resetForm(examForm);
  openModal('examModal');
}

function editExam(id) {
  const exam = exams.find((e) => e.id === id);
  if (!exam) return;

  document.getElementById('examModalTitle').textContent = 'Edit Exam';
  document.getElementById('examSubmitBtn').textContent = 'Update Exam';
  document.getElementById('examEditId').value = exam.id;
  document.getElementById('examName').value = exam.name;
  document.getElementById('examSubject').value = exam.subject;
  document.getElementById('examQuestions').value = exam.questions;
  document.getElementById('examDate').value = exam.date;
  document.getElementById('examStatus').value = exam.status;
  clearFormErrors(examForm);
  openModal('examModal');
}

function viewExam(id) {
  const exam = exams.find((e) => e.id === id);
  if (!exam) return;
  showToast(
    `Exam: ${exam.name} | Subject: ${exam.subject} | Questions: ${exam.questions} | Students: ${exam.students} | Status: ${exam.status}`,
    'info'
  );
}

function deleteExam(id) {
  const exam = exams.find((e) => e.id === id);
  if (!exam) return;
  showConfirm(
    `Delete "${exam.name}"?`,
    'This exam will be permanently removed from the table.',
    () => {
      exams = exams.filter((e) => e.id !== id);
      renderExams();
      updateExamStats();
      showToast(`"${exam.name}" has been deleted.`, 'success');
    }
  );
}

// ---------- Form Submit ----------
examForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearFormErrors(examForm);

  let valid = true;
  const name = document.getElementById('examName');
  const subject = document.getElementById('examSubject');
  const questions = document.getElementById('examQuestions');
  const date = document.getElementById('examDate');

  if (!validateField(name, 'examNameError', 'Please enter an exam name.')) valid = false;
  if (!validateField(subject, 'examSubjectError', 'Please enter a subject.')) valid = false;
  if (!validateField(questions, 'examQuestionsError', 'Please enter a valid number.') || questions.value < 1) {
    questions.classList.add('invalid');
    document.getElementById('examQuestionsError').classList.add('active');
    valid = false;
  }
  if (!validateField(date, 'examDateError', 'Please select a date.')) valid = false;

  if (!valid) return;

  const editId = document.getElementById('examEditId').value;
  const data = {
    name: name.value.trim(),
    subject: subject.value.trim(),
    questions: parseInt(questions.value),
    date: date.value,
    status: document.getElementById('examStatus').value,
  };

  if (editId) {
    const exam = exams.find((e) => e.id === parseInt(editId));
    Object.assign(exam, data);
    showToast(`"${data.name}" has been updated.`, 'success');
  } else {
    exams.push({
      id: nextExamId++,
      students: 0,
      ...data,
    });
    showToast(`"${data.name}" has been created.`, 'success');
  }

  closeModal('examModal');
  renderExams();
  updateExamStats();
});

// ---------- Event Listeners ----------
document.getElementById('examSearch').addEventListener('input', renderExams);
document.getElementById('examStatusFilter').addEventListener('change', renderExams);
document.getElementById('createExamBtn').addEventListener('click', openCreateExam);

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  renderExams();
  updateExamStats();
});
