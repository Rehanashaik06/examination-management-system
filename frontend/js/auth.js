const STUDENT_KEY = 'oes_student';

const form = document.getElementById('loginForm');
const studentIdInput = document.getElementById('studentId');
const passwordInput = document.getElementById('password');
const studentIdError = document.getElementById('studentIdError');
const passwordError = document.getElementById('passwordError');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');
const togglePassword = document.getElementById('togglePassword');

function clearErrors() {
  studentIdError.textContent = '';
  passwordError.textContent = '';
  loginError.textContent = '';
  studentIdInput.classList.remove('input-error');
  passwordInput.classList.remove('input-error');
}

function showError(input, errorEl, message) {
  errorEl.textContent = message;
  input.classList.add('input-error');
}

function validate(id, password) {
  let ok = true;
  if (!id.trim()) {
    showError(studentIdInput, studentIdError, 'Student ID is required.');
    ok = false;
  }
  if (!password) {
    showError(passwordInput, passwordError, 'Password is required.');
    ok = false;
  }
  return ok;
}

if (togglePassword) {
  togglePassword.addEventListener('click', () => {
    const isPwd = passwordInput.type === 'password';
    passwordInput.type = isPwd ? 'text' : 'password';
    togglePassword.textContent = isPwd ? 'Hide' : 'Show';
    togglePassword.setAttribute('aria-label', isPwd ? 'Hide password' : 'Show password');
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();

  const id = studentIdInput.value.trim();
  const password = passwordInput.value;

  if (!validate(id, password)) return;

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  setTimeout(() => {
    const student = {
      id,
      name: id,
      loginAt: Date.now(),
    };
    sessionStorage.setItem(STUDENT_KEY, JSON.stringify(student));
    window.location.href = '/dashboard.html';
  }, 350);
});
