export const EXAMS = [
  {
    id: 'gk',
    title: 'General Knowledge Test',
    type: 'Objective (MCQ)',
    durationMinutes: 30,
    totalQuestions: 30,
    totalMarks: 30,
    correctMark: 1,
    negativeMark: 0,
    questionsKey: 'gk',
  },
  {
    id: 'pcm',
    title: 'Physics, Chemistry & Mathematics',
    type: 'Objective (MCQ)',
    durationMinutes: 60,
    totalQuestions: 30,
    totalMarks: 120,
    correctMark: 4,
    negativeMark: 1,
    questionsKey: 'pcm',
  },
];

export function getExamById(id) {
  return EXAMS.find((e) => e.id === id) || null;
}

export function getStudent() {
  try {
    const raw = sessionStorage.getItem('oes_student');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function requireStudent() {
  const student = getStudent();
  if (!student) {
    window.location.href = '/index.html';
    return null;
  }
  return student;
}

export function logout() {
  sessionStorage.removeItem('oes_student');
  sessionStorage.removeItem('oes_exam_state');
  sessionStorage.removeItem('oes_active_exam');
  window.location.href = '/index.html';
}
