import { getExamById, requireStudent } from './exam-config.js';
import { getQuestions } from './questions.js';

const student = requireStudent();
const examId = sessionStorage.getItem('oes_active_exam');
const exam = getExamById(examId);

if (!exam) {
  window.location.href = '/dashboard.html';
} else {
  const questions = getQuestions(exam.questionsKey);
  if (questions.length === 0) {
    window.location.href = '/dashboard.html';
  } else {
    runExam(exam, questions, student);
  }
}

function runExam(exam, questions, student) {
  // ---------- State ----------
  // answers: { [questionId]: selectedIndex }
  // marked: Set<questionId>
  // visited: Set<questionId>
  // currentIndex: number (index into questions array)
  const STATE_KEY = 'oes_exam_state';
  const RESULT_KEY = 'oes_exam_result';

  const saved = loadState();
  const state = saved || {
    examId: exam.id,
    answers: {},
    marked: [],
    visited: [questions[0].id],
    currentIndex: 0,
    startedAt: Date.now(),
  };

  function loadState() {
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (s.examId !== exam.id) return null;
      return s;
    } catch {
      return null;
    }
  }
  function saveState() {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  // ---------- Subjects ----------
  const subjects = [];
  questions.forEach((q) => {
    if (!subjects.includes(q.subject)) subjects.push(q.subject);
  });

  // ---------- DOM refs ----------
  const el = {
    examName: document.getElementById('examName'),
    studentName: document.getElementById('studentName'),
    timer: document.getElementById('timer'),
    subjectBar: document.getElementById('subjectBar'),
    qNum: document.getElementById('qNum'),
    markCorrect: document.getElementById('markCorrect'),
    markNegative: document.getElementById('markNegative'),
    questionText: document.getElementById('questionText'),
    optionsList: document.getElementById('optionsList'),
    prevBtn: document.getElementById('prevBtn'),
    clearBtn: document.getElementById('clearBtn'),
    markReviewBtn: document.getElementById('markReviewBtn'),
    saveNextBtn: document.getElementById('saveNextBtn'),
    submitBtn: document.getElementById('submitBtn'),
    palette: document.getElementById('palette'),
    submitModal: document.getElementById('submitModal'),
    modalText: document.getElementById('modalText'),
    modalSummary: document.getElementById('modalSummary'),
    cancelSubmit: document.getElementById('cancelSubmit'),
    confirmSubmit: document.getElementById('confirmSubmit'),
  };

  el.examName.textContent = exam.title;
  el.studentName.textContent = student ? student.id : 'Student';

  // ---------- Helpers ----------
  function currentQuestion() {
    return questions[state.currentIndex];
  }
  function isSelected(qId) {
    return state.answers[qId] !== undefined && state.answers[qId] !== null;
  }
  function isMarked(qId) {
    return state.marked.includes(qId);
  }
  function statusFor(q, idx) {
    const visited = state.visited.includes(q.id);
    const answered = isSelected(q.id);
    const marked = isMarked(q.id);
    if (marked && answered) return 'answered-marked';
    if (marked) return 'marked';
    if (answered) return 'answered';
    if (visited) return 'not-answered';
    return 'not-visited';
  }

  // ---------- Render subjects ----------
  function renderSubjects() {
    el.subjectBar.innerHTML = subjects
      .map((s) => {
        const count = questions.filter((q) => q.subject === s).length;
        const active = currentQuestion().subject === s ? 'active' : '';
        return `<button class="subject-tab ${active}" data-subject="${s}">${s}<span class="tab-count">(${count})</span></button>`;
      })
      .join('');
    el.subjectBar.querySelectorAll('[data-subject]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const subj = btn.getAttribute('data-subject');
        const idx = questions.findIndex((q) => q.subject === subj);
        if (idx >= 0) goTo(idx);
      });
    });
  }

  // ---------- Render question ----------
  function renderQuestion() {
    const q = currentQuestion();
    if (!state.visited.includes(q.id)) state.visited.push(q.id);

    const displayNum = state.currentIndex + 1;
    el.qNum.textContent = `Question ${displayNum} of ${questions.length}`;
    el.questionText.textContent = q.text;
    el.markCorrect.textContent = `+${exam.correctMark}`;
    el.markNegative.textContent = exam.negativeMark > 0 ? `-${exam.negativeMark}` : '';
    el.markNegative.style.display = exam.negativeMark > 0 ? '' : 'none';

    const selected = state.answers[q.id];
    el.optionsList.innerHTML = q.options
      .map((opt, i) => {
        const checked = selected === i ? 'selected' : '';
        const radioChecked = selected === i ? 'checked' : '';
        return `
          <label class="option ${checked}" data-index="${i}">
            <input type="radio" name="opt_${q.id}" value="${i}" ${radioChecked} />
            <span class="option-label">${String.fromCharCode(65 + i)}. ${opt}</span>
          </label>`;
      })
      .join('');

    el.optionsList.querySelectorAll('.option').forEach((optEl) => {
      optEl.addEventListener('click', (e) => {
        // Let radio change event handle it if input was clicked
        const idx = Number(optEl.getAttribute('data-index'));
        selectOption(idx);
      });
    });

    // Update active subject tab
    el.subjectBar.querySelectorAll('[data-subject]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-subject') === q.subject);
    });

    el.prevBtn.disabled = state.currentIndex === 0;
    renderPalette();
    renderSubjects();
    saveState();
  }

  function selectOption(idx) {
    const q = currentQuestion();
    state.answers[q.id] = idx;
    // Update DOM visuals without full re-render
    el.optionsList.querySelectorAll('.option').forEach((optEl) => {
      const i = Number(optEl.getAttribute('data-index'));
      optEl.classList.toggle('selected', i === idx);
      const input = optEl.querySelector('input');
      input.checked = i === idx;
    });
    renderPalette();
    saveState();
  }

  // ---------- Palette ----------
  function renderPalette() {
    el.palette.innerHTML = questions
      .map((q, idx) => {
        const status = statusFor(q, idx);
        const current = idx === state.currentIndex ? 'current' : '';
        return `<button class="pq ${status} ${current}" data-idx="${idx}" title="${q.subject} - Q${idx + 1}">${idx + 1}</button>`;
      })
      .join('');
    el.palette.querySelectorAll('[data-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        goTo(idx);
      });
    });
  }

  // ---------- Navigation ----------
  function goTo(idx) {
    if (idx < 0 || idx >= questions.length) return;
    state.currentIndex = idx;
    renderQuestion();
  }
  function saveAndNext() {
    // Answer already saved on selection; just move forward
    if (state.currentIndex < questions.length - 1) {
      goTo(state.currentIndex + 1);
    } else {
      // Last question: stay, prompt submit
      openSubmitModal();
    }
  }
  function markReviewAndNext() {
    const q = currentQuestion();
    if (!state.marked.includes(q.id)) state.marked.push(q.id);
    if (state.currentIndex < questions.length - 1) {
      goTo(state.currentIndex + 1);
    } else {
      openSubmitModal();
    }
  }
  function clearResponse() {
    const q = currentQuestion();
    delete state.answers[q.id];
    renderQuestion();
  }

  // ---------- Timer ----------
  let timerInterval = null;
  let submitted = false;
  const totalSeconds = exam.durationMinutes * 60;

  function startTimer() {
    const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
    let remaining = Math.max(totalSeconds - elapsed, 0);
    updateTimerDisplay(remaining);
    timerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timerInterval);
        updateTimerDisplay(0);
        autoSubmit();
        return;
      }
      updateTimerDisplay(remaining);
    }, 1000);
  }
  function updateTimerDisplay(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    el.timer.textContent =
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    el.timer.classList.remove('warn', 'danger');
    if (sec <= 60) el.timer.classList.add('danger');
    else if (sec <= 300) el.timer.classList.add('warn');
  }

  // ---------- Submit ----------
  function unansweredCount() {
    return questions.filter((q) => !isSelected(q.id)).length;
  }
  function attemptedCount() {
    return questions.filter((q) => isSelected(q.id)).length;
  }

  function openSubmitModal() {
    if (submitted) return;
    const unanswered = unansweredCount();
    const attempted = attemptedCount();
    el.modalText.textContent =
      unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Are you sure you want to submit?`
        : 'You have answered all questions. Are you sure you want to submit?';
    el.modalSummary.innerHTML = `
      <div class="modal-summary-row"><span class="ms-label">Total Questions</span><span class="ms-value">${questions.length}</span></div>
      <div class="modal-summary-row"><span class="ms-label">Attempted</span><span class="ms-value">${attempted}</span></div>
      <div class="modal-summary-row"><span class="ms-label">Unanswered</span><span class="ms-value">${unanswered}</span></div>
    `;
    el.submitModal.hidden = false;
  }
  function closeSubmitModal() {
    el.submitModal.hidden = true;
  }

  function calculateResult() {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    questions.forEach((q) => {
      if (!isSelected(q.id)) {
        unattempted += 1;
        return;
      }
      if (state.answers[q.id] === q.correct) {
        correct += 1;
      } else {
        incorrect += 1;
      }
    });
    const marks = correct * exam.correctMark - incorrect * exam.negativeMark;
    const maxMarks = questions.length * exam.correctMark;
    const percentage = maxMarks > 0 ? Math.round((marks / maxMarks) * 1000) / 10 : 0;
    return {
      examId: exam.id,
      examTitle: exam.title,
      studentId: student ? student.id : 'Student',
      totalQuestions: questions.length,
      attempted: correct + incorrect,
      correct,
      incorrect,
      unattempted,
      marks,
      maxMarks,
      percentage,
      submittedAt: Date.now(),
      answers: state.answers,
    };
  }

  function submitTest() {
    if (submitted) return;
    submitted = true;
    if (timerInterval) clearInterval(timerInterval);
    const result = calculateResult();
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    sessionStorage.removeItem(STATE_KEY);
    window.location.href = '/result.html';
  }
  function autoSubmit() {
    if (submitted) return;
    submitted = true;
    const result = calculateResult();
    result.autoSubmitted = true;
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    sessionStorage.removeItem(STATE_KEY);
    window.location.href = '/result.html';
  }

  // ---------- Wire up buttons ----------
  el.prevBtn.addEventListener('click', () => goTo(state.currentIndex - 1));
  el.clearBtn.addEventListener('click', clearResponse);
  el.markReviewBtn.addEventListener('click', markReviewAndNext);
  el.saveNextBtn.addEventListener('click', saveAndNext);
  el.submitBtn.addEventListener('click', openSubmitModal);
  el.cancelSubmit.addEventListener('click', closeSubmitModal);
  el.confirmSubmit.addEventListener('click', submitTest);

  // Close modal on overlay click
  el.submitModal.addEventListener('click', (e) => {
    if (e.target === el.submitModal) closeSubmitModal();
  });

  // ---------- Keyboard shortcuts ----------
  document.addEventListener('keydown', (e) => {
    if (el.submitModal.hidden === false) return;
    if (e.key === 'ArrowRight') saveAndNext();
    if (e.key === 'ArrowLeft') goTo(state.currentIndex - 1);
  });

  // ---------- Init ----------
  renderQuestion();
  startTimer();
}
