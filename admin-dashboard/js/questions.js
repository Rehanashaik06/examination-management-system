/* ===========================
   Questions Page JS - Full CRUD
   with dynamic question type handling
   =========================== */

let questions = [
  { id: 1, exam: 'Data Structures', subject: 'Computer Science', text: 'What is the time complexity of binary search?', type: 'MCQ', marks: 2, options: { A: 'O(n)', B: 'O(log n)', C: 'O(n^2)', D: 'O(1)' }, correct: 'B', answer: '' },
  { id: 2, exam: 'Data Structures', subject: 'Computer Science', text: 'A stack follows the LIFO principle.', type: 'True/False', marks: 1, options: {}, correct: '', answer: 'True' },
  { id: 3, exam: 'Machine Learning', subject: 'Computer Science', text: 'What does CNN stand for in deep learning?', type: 'MCQ', marks: 2, options: { A: 'Central Neural Network', B: 'Convolutional Neural Network', C: 'Cyclic Neural Network', D: 'Common Neural Network' }, correct: 'B', answer: '' },
  { id: 4, exam: 'Operating Systems', subject: 'Computer Science', text: 'Explain the concept of process scheduling.', type: 'Short Answer', marks: 5, options: {}, correct: '', answer: 'Process scheduling is the method by which the OS decides which process runs at a given time.' },
  { id: 5, exam: 'Database Management', subject: 'Computer Science', text: 'What does ACID stand for in databases?', type: 'MCQ', marks: 2, options: { A: 'Atomicity, Consistency, Isolation, Durability', B: 'Accuracy, Control, Integrity, Data', C: 'Access, Control, Identity, Data', D: 'Atomic, Consistent, Isolated, Durable' }, correct: 'A', answer: '' },
  { id: 6, exam: 'Data Structures', subject: 'Computer Science', text: 'A queue follows the FIFO principle.', type: 'True/False', marks: 1, options: {}, correct: '', answer: 'True' },
];

let nextQuestionId = 7;

const questionTableBody = document.getElementById('questionsTableBody');
const questionForm = document.getElementById('questionForm');

// ---------- Toggle question type fields ----------
function updateQuestionTypeFields() {
  const type = document.getElementById('qType').value;
  const mcqOpts = document.getElementById('mcqOptions');
  const tfOpts = document.getElementById('tfOptions');
  const saOpts = document.getElementById('saOptions');
  const mcqCorrect = document.getElementById('mcqCorrectRow');

  mcqOpts.style.display = type === 'MCQ' ? 'block' : 'none';
  tfOpts.style.display = type === 'True/False' ? 'block' : 'none';
  saOpts.style.display = type === 'Short Answer' ? 'block' : 'none';
  mcqCorrect.style.display = type === 'MCQ' ? 'block' : 'none';
}

// ---------- Render Table ----------
function renderQuestions() {
  const search = document.getElementById('questionSearch').value.toLowerCase().trim();
  const fSubject = document.getElementById('qFilterSubject').value;
  const fExam = document.getElementById('qFilterExam').value;
  const fType = document.getElementById('qFilterType').value;

  let filtered = questions.filter((q) => {
    const matchSearch = q.text.toLowerCase().includes(search) || q.subject.toLowerCase().includes(search);
    const matchSubject = fSubject === 'all' || q.subject === fSubject;
    const matchExam = fExam === 'all' || q.exam === fExam;
    const matchType = fType === 'all' || q.type === fType;
    return matchSearch && matchSubject && matchExam && matchType;
  });

  if (filtered.length === 0) {
    questionTableBody.innerHTML = renderEmptyState(6, 'No questions found', 'Try adjusting your search or filters.');
    return;
  }

  questionTableBody.innerHTML = filtered
    .map((q) => {
      const typeBadge =
        q.type === 'MCQ' ? 'badge-info' : q.type === 'True/False' ? 'badge-warning' : 'badge-neutral';
      return `
      <tr data-id="${q.id}">
        <td class="question-text-cell" title="${q.text.replace(/"/g, '&quot;')}">${q.text}</td>
        <td class="cell-muted">${q.exam}</td>
        <td>${q.subject}</td>
        <td><span class="badge ${typeBadge}">${q.type}</span></td>
        <td>${q.marks}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" title="Edit" onclick="editQuestion(${q.id})">✏️</button>
            <button class="action-btn view" title="View" onclick="viewQuestion(${q.id})">👁️</button>
            <button class="action-btn delete" title="Delete" onclick="deleteQuestion(${q.id})">🗑️</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

// ---------- Update Stats ----------
function updateQuestionStats() {
  updateStat('qStatTotal', questions.length);
  updateStat('qStatMCQ', questions.filter((q) => q.type === 'MCQ').length);
  updateStat('qStatTF', questions.filter((q) => q.type === 'True/False').length);
  updateStat('qStatSA', questions.filter((q) => q.type === 'Short Answer').length);
}

// ---------- Create/Edit ----------
function openCreateQuestion() {
  document.getElementById('questionModalTitle').textContent = 'Create Question';
  document.getElementById('questionSubmitBtn').textContent = 'Create Question';
  document.getElementById('questionEditId').value = '';
  resetForm(questionForm);
  updateQuestionTypeFields();
  openModal('questionModal');
}

function editQuestion(id) {
  const q = questions.find((x) => x.id === id);
  if (!q) return;

  document.getElementById('questionModalTitle').textContent = 'Edit Question';
  document.getElementById('questionSubmitBtn').textContent = 'Update Question';
  document.getElementById('questionEditId').value = q.id;
  document.getElementById('qExam').value = q.exam;
  document.getElementById('qSubject').value = q.subject;
  document.getElementById('qText').value = q.text;
  document.getElementById('qType').value = q.type;
  document.getElementById('qMarks').value = q.marks;

  // Populate MCQ options
  if (q.type === 'MCQ' && q.options) {
    document.getElementById('qOptionA').value = q.options.A || '';
    document.getElementById('qOptionB').value = q.options.B || '';
    document.getElementById('qOptionC').value = q.options.C || '';
    document.getElementById('qOptionD').value = q.options.D || '';
    document.getElementById('qCorrectAnswer').value = q.correct || 'A';
  }
  if (q.type === 'True/False') {
    document.getElementById('qTFAnswer').value = q.answer || 'True';
  }
  if (q.type === 'Short Answer') {
    document.getElementById('qSAAnswer').value = q.answer || '';
  }

  updateQuestionTypeFields();
  clearFormErrors(questionForm);
  openModal('questionModal');
}

function viewQuestion(id) {
  const q = questions.find((x) => x.id === id);
  if (!q) return;

  let detail = `Exam: ${q.exam} | Subject: ${q.subject} | Type: ${q.type} | Marks: ${q.marks}`;
  if (q.type === 'MCQ') {
    detail += ` | Correct: ${q.correct}`;
  } else {
    detail += ` | Answer: ${q.answer}`;
  }
  showToast(detail, 'info');
}

function deleteQuestion(id) {
  const q = questions.find((x) => x.id === id);
  if (!q) return;
  showConfirm(
    'Delete this question?',
    `"${q.text.substring(0, 40)}${q.text.length > 40 ? '...' : ''}" will be permanently removed.`,
    () => {
      questions = questions.filter((x) => x.id !== id);
      renderQuestions();
      updateQuestionStats();
      showToast('Question has been deleted.', 'success');
    }
  );
}

// ---------- Form Submit ----------
questionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearFormErrors(questionForm);

  let valid = true;
  const examEl = document.getElementById('qExam');
  const subjectEl = document.getElementById('qSubject');
  const textEl = document.getElementById('qText');
  const marksEl = document.getElementById('qMarks');
  const type = document.getElementById('qType').value;

  if (!validateField(examEl, 'qExamError', 'Please select an exam.')) valid = false;
  if (!validateField(subjectEl, 'qSubjectError', 'Please select a subject.')) valid = false;
  if (!validateField(textEl, 'qTextError', 'Please enter the question text.')) valid = false;
  if (!validateField(marksEl, 'qMarksError', 'Please enter valid marks.') || marksEl.value < 1) {
    marksEl.classList.add('invalid');
    document.getElementById('qMarksError').classList.add('active');
    valid = false;
  }

  // MCQ validation: at least options A and B
  if (type === 'MCQ') {
    const optA = document.getElementById('qOptionA');
    const optB = document.getElementById('qOptionB');
    if (!optA.value.trim() || !optB.value.trim()) {
      showToast('MCQ requires at least Options A and B.', 'warning');
      valid = false;
    }
  }

  if (!valid) return;

  const editId = document.getElementById('questionEditId').value;
  const data = {
    exam: examEl.value,
    subject: subjectEl.value,
    text: textEl.value.trim(),
    type: type,
    marks: parseInt(marksEl.value),
  };

  if (type === 'MCQ') {
    data.options = {
      A: document.getElementById('qOptionA').value.trim(),
      B: document.getElementById('qOptionB').value.trim(),
      C: document.getElementById('qOptionC').value.trim(),
      D: document.getElementById('qOptionD').value.trim(),
    };
    data.correct = document.getElementById('qCorrectAnswer').value;
    data.answer = '';
  } else if (type === 'True/False') {
    data.options = {};
    data.correct = '';
    data.answer = document.getElementById('qTFAnswer').value;
  } else {
    data.options = {};
    data.correct = '';
    data.answer = document.getElementById('qSAAnswer').value.trim();
  }

  if (editId) {
    const q = questions.find((x) => x.id === parseInt(editId));
    Object.assign(q, data);
    showToast('Question has been updated.', 'success');
  } else {
    questions.push({ id: nextQuestionId++, ...data });
    showToast('Question has been created.', 'success');
  }

  closeModal('questionModal');
  renderQuestions();
  updateQuestionStats();
});

// ---------- Event Listeners ----------
document.getElementById('questionSearch').addEventListener('input', renderQuestions);
document.getElementById('qFilterSubject').addEventListener('change', renderQuestions);
document.getElementById('qFilterExam').addEventListener('change', renderQuestions);
document.getElementById('qFilterType').addEventListener('change', renderQuestions);
document.getElementById('createQuestionBtn').addEventListener('click', openCreateQuestion);
document.getElementById('qType').addEventListener('change', updateQuestionTypeFields);

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  renderQuestions();
  updateQuestionStats();
});
