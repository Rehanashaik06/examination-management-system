/* ===========================
   Settings Page JS
   Profile, Password, System, Notifications
   =========================== */

// ---------- Profile Settings ----------
const profileForm = document.getElementById('profileForm');
const profileDefaults = { name: 'Admin User', email: 'admin@examportal.com', phone: '+91 98765 43210' };

profileForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearFormErrors(profileForm);

  let valid = true;
  const name = document.getElementById('adminName');
  const email = document.getElementById('adminEmail');

  if (!validateField(name, 'adminNameError', 'Please enter admin name.')) valid = false;
  if (!validateField(email, 'adminEmailError', 'Please enter a valid email.') || !email.value.includes('@')) {
    email.classList.add('invalid');
    document.getElementById('adminEmailError').classList.add('active');
    valid = false;
  }

  if (valid) showToast('Profile settings saved successfully.', 'success');
});

document.getElementById('resetProfileBtn').addEventListener('click', () => {
  document.getElementById('adminName').value = profileDefaults.name;
  document.getElementById('adminEmail').value = profileDefaults.email;
  document.getElementById('adminPhone').value = profileDefaults.phone;
  clearFormErrors(profileForm);
  showToast('Profile settings reset.', 'warning');
});

// ---------- Change Password ----------
const passwordForm = document.getElementById('passwordForm');

passwordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearFormErrors(passwordForm);

  let valid = true;
  const current = document.getElementById('currentPassword');
  const newPwd = document.getElementById('newPassword');
  const confirm = document.getElementById('confirmPassword');

  if (!validateField(current, 'currentPasswordError', 'Please enter current password.')) valid = false;

  if (!newPwd.value.trim() || newPwd.value.length < 6) {
    newPwd.classList.add('invalid');
    document.getElementById('newPasswordError').classList.add('active');
    valid = false;
  }

  if (confirm.value !== newPwd.value || !confirm.value.trim()) {
    confirm.classList.add('invalid');
    document.getElementById('confirmPasswordError').classList.add('active');
    valid = false;
  }

  if (valid) {
    showToast('Password updated successfully.', 'success');
    passwordForm.reset();
  }
});

document.getElementById('resetPasswordBtn').addEventListener('click', () => {
  passwordForm.reset();
  clearFormErrors(passwordForm);
  showToast('Password form reset.', 'warning');
});

// ---------- System Settings ----------
const systemForm = document.getElementById('systemForm');
const systemDefaults = { duration: 60, marks: 1, passing: 50, visibility: 'immediate' };

systemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearFormErrors(systemForm);

  let valid = true;
  const duration = document.getElementById('examDuration');
  const marks = document.getElementById('defaultMarks');
  const passing = document.getElementById('passingPct');

  if (!validateField(duration, 'examDurationError', 'Please enter a valid duration.') || duration.value < 1) {
    duration.classList.add('invalid');
    document.getElementById('examDurationError').classList.add('active');
    valid = false;
  }
  if (!validateField(marks, 'defaultMarksError', 'Please enter valid marks.') || marks.value < 1) {
    marks.classList.add('invalid');
    document.getElementById('defaultMarksError').classList.add('active');
    valid = false;
  }
  if (!validateField(passing, 'passingPctError', 'Please enter a value between 1 and 100.') || passing.value < 1 || passing.value > 100) {
    passing.classList.add('invalid');
    document.getElementById('passingPctError').classList.add('active');
    valid = false;
  }

  if (valid) showToast('System settings saved successfully.', 'success');
});

document.getElementById('resetSystemBtn').addEventListener('click', () => {
  document.getElementById('examDuration').value = systemDefaults.duration;
  document.getElementById('defaultMarks').value = systemDefaults.marks;
  document.getElementById('passingPct').value = systemDefaults.passing;
  document.getElementById('resultVisibility').value = systemDefaults.visibility;
  clearFormErrors(systemForm);
  showToast('System settings reset.', 'warning');
});

// ---------- Notification Settings ----------
const notifDefaults = { email: true, exam: true, result: false };

document.getElementById('saveNotifBtn').addEventListener('click', () => {
  showToast('Notification settings saved successfully.', 'success');
});

document.getElementById('resetNotifBtn').addEventListener('click', () => {
  document.getElementById('notifEmail').checked = notifDefaults.email;
  document.getElementById('notifExam').checked = notifDefaults.exam;
  document.getElementById('notifResult').checked = notifDefaults.result;
  showToast('Notification settings reset.', 'warning');
});
