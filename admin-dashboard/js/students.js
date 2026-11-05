/* ===========================
   Students Page JS - Full CRUD
   =========================== */

let students = [
  { id: 1, studentId: 'STU001', name: 'Rahul Kumar', email: 'rahul@example.com', dept: 'CSE', year: '3rd Year', phone: '+91 98765 43210', examsTaken: 8, status: 'active' },
  { id: 2, studentId: 'STU002', name: 'Priya Sharma', email: 'priya@example.com', dept: 'CSE', year: '4th Year', phone: '+91 98765 11111', examsTaken: 12, status: 'active' },
  { id: 3, studentId: 'STU003', name: 'Amit Singh', email: 'amit@example.com', dept: 'ECE', year: '2nd Year', phone: '+91 98765 22222', examsTaken: 5, status: 'active' },
  { id: 4, studentId: 'STU004', name: 'Sneha Patel', email: 'sneha@example.com', dept: 'IT', year: '3rd Year', phone: '+91 98765 33333', examsTaken: 15, status: 'active' },
  { id: 5, studentId: 'STU005', name: 'Vikram Reddy', email: 'vikram@example.com', dept: 'ME', year: '4th Year', phone: '+91 98765 44444', examsTaken: 8, status: 'inactive' },
];

let nextStudentId = 6;
let studentAutoId = 6;

const studentTableBody = document.getElementById('studentsTableBody');
const studentForm = document.getElementById('studentForm');

// ---------- Render Table ----------
function renderStudents() {
  const search = document.getElementById('studentSearch').value.toLowerCase().trim();
  const fDept = document.getElementById('studentDeptFilter').value;
  const fYear = document.getElementById('studentYearFilter').value;
  const fStatus = document.getElementById('studentStatusFilter').value;

  let filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search) ||
      s.studentId.toLowerCase().includes(search);
    const matchDept = fDept === 'all' || s.dept === fDept;
    const matchYear = fYear === 'all' || s.year === fYear;
    const matchStatus = fStatus === 'all' || s.status === fStatus;
    return matchSearch && matchDept && matchYear && matchStatus;
  });

  if (filtered.length === 0) {
    studentTableBody.innerHTML = renderEmptyState(8, 'No students found', 'Try adjusting your search or filters.');
    return;
  }

  studentTableBody.innerHTML = filtered
    .map((s) => {
      const isActive = s.status === 'active';
      return `
      <tr data-id="${s.id}">
        <td class="cell-strong">${s.studentId}</td>
        <td class="cell-strong">${s.name}</td>
        <td class="cell-muted">${s.email}</td>
        <td>${s.dept}</td>
        <td>${s.year}</td>
        <td>${s.examsTaken}</td>
        <td><span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">${isActive ? '✅ Active' : '⛔ Inactive'}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn view" title="View" onclick="viewStudent(${s.id})">👁️</button>
            <button class="action-btn edit" title="Edit" onclick="editStudent(${s.id})">✏️</button>
            <button class="action-btn" title="${isActive ? 'Deactivate' : 'Activate'}" onclick="toggleStudentStatus(${s.id})">${isActive ? '🚫' : '✅'}</button>
            <button class="action-btn delete" title="Delete" onclick="deleteStudent(${s.id})">🗑️</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

// ---------- Update Stats ----------
function updateStudentStats() {
  updateStat('studentStatTotal', students.length);
  updateStat('studentStatActive', students.filter((s) => s.status === 'active').length);
  updateStat('studentStatInactive', students.filter((s) => s.status === 'inactive').length);
  updateStat('studentStatExams', students.reduce((sum, s) => sum + s.examsTaken, 0));
}

// ---------- Create/Edit ----------
function openAddStudent() {
  document.getElementById('studentModalTitle').textContent = 'Add Student';
  document.getElementById('studentSubmitBtn').textContent = 'Add Student';
  document.getElementById('studentEditId').value = '';
  resetForm(studentForm);
  // Auto-generate next student ID
  document.getElementById('studentId').value = 'STU' + String(studentAutoId).padStart(3, '0');
  openModal('studentModal');
}

function editStudent(id) {
  const s = students.find((x) => x.id === id);
  if (!s) return;

  document.getElementById('studentModalTitle').textContent = 'Edit Student';
  document.getElementById('studentSubmitBtn').textContent = 'Update Student';
  document.getElementById('studentEditId').value = s.id;
  document.getElementById('studentId').value = s.studentId;
  document.getElementById('studentName').value = s.name;
  document.getElementById('studentEmail').value = s.email;
  document.getElementById('studentDept').value = s.dept;
  document.getElementById('studentYear').value = s.year;
  document.getElementById('studentPhone').value = s.phone || '';
  document.getElementById('studentStatus').value = s.status;
  clearFormErrors(studentForm);
  openModal('studentModal');
}

function viewStudent(id) {
  const s = students.find((x) => x.id === id);
  if (!s) return;
  showToast(
    `${s.studentId} | ${s.name} | ${s.email} | ${s.dept} | ${s.year} | Exams: ${s.examsTaken} | ${s.status}`,
    'info'
  );
}

function toggleStudentStatus(id) {
  const s = students.find((x) => x.id === id);
  if (!s) return;
  s.status = s.status === 'active' ? 'inactive' : 'active';
  renderStudents();
  updateStudentStats();
  showToast(`${s.name} is now ${s.status}.`, s.status === 'active' ? 'success' : 'warning');
}

function deleteStudent(id) {
  const s = students.find((x) => x.id === id);
  if (!s) return;
  showConfirm(
    `Delete "${s.name}"?`,
    `Student ${s.studentId} will be permanently removed.`,
    () => {
      students = students.filter((x) => x.id !== id);
      renderStudents();
      updateStudentStats();
      showToast(`"${s.name}" has been deleted.`, 'success');
    }
  );
}

// ---------- Form Submit ----------
studentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearFormErrors(studentForm);

  let valid = true;
  const sid = document.getElementById('studentId');
  const name = document.getElementById('studentName');
  const email = document.getElementById('studentEmail');
  const dept = document.getElementById('studentDept');
  const year = document.getElementById('studentYear');

  if (!validateField(sid, 'studentIdError', 'Please enter a student ID.')) valid = false;
  if (!validateField(name, 'studentNameError', 'Please enter a name.')) valid = false;
  if (!validateField(email, 'studentEmailError', 'Please enter a valid email.') || !email.value.includes('@')) {
    email.classList.add('invalid');
    document.getElementById('studentEmailError').classList.add('active');
    valid = false;
  }
  if (!validateField(dept, 'studentDeptError', 'Please select a department.')) valid = false;
  if (!validateField(year, 'studentYearError', 'Please select a year.')) valid = false;

  if (!valid) return;

  const editId = document.getElementById('studentEditId').value;
  const data = {
    studentId: sid.value.trim(),
    name: name.value.trim(),
    email: email.value.trim(),
    dept: dept.value,
    year: year.value,
    phone: document.getElementById('studentPhone').value.trim(),
    status: document.getElementById('studentStatus').value,
  };

  if (editId) {
    const s = students.find((x) => x.id === parseInt(editId));
    Object.assign(s, data);
    showToast(`"${data.name}" has been updated.`, 'success');
  } else {
    students.push({ id: nextStudentId++, examsTaken: 0, ...data });
    studentAutoId++;
    showToast(`"${data.name}" has been added.`, 'success');
  }

  closeModal('studentModal');
  renderStudents();
  updateStudentStats();
});

// ---------- Event Listeners ----------
document.getElementById('studentSearch').addEventListener('input', renderStudents);
document.getElementById('studentDeptFilter').addEventListener('change', renderStudents);
document.getElementById('studentYearFilter').addEventListener('change', renderStudents);
document.getElementById('studentStatusFilter').addEventListener('change', renderStudents);
document.getElementById('addStudentBtn').addEventListener('click', openAddStudent);

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  renderStudents();
  updateStudentStats();
});
