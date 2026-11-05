
const USER_KEY = 'oes_user';
const STUDENT_KEY = 'oes_student';

const form = document.getElementById('loginForm');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const loginError = document.getElementById('loginError');

const loginBtn = document.getElementById('loginBtn');
const togglePassword = document.getElementById('togglePassword');

// Clear previous errors
function clearErrors() {
    emailError.textContent = '';
    passwordError.textContent = '';
    loginError.textContent = '';

    emailInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');
}

// Display validation errors
function showError(input, errorElement, message) {
    errorElement.textContent = message;
    input.classList.add('input-error');
}

// Validate login details
function validate(email, password) {
    let valid = true;

    if (!email.trim()) {
        showError(
            emailInput,
            emailError,
            'Email address is required.'
        );
        valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError(
            emailInput,
            emailError,
            'Please enter a valid email address.'
        );
        valid = false;
    }

    if (!password) {
        showError(
            passwordInput,
            passwordError,
            'Password is required.'
        );
        valid = false;
    }

    return valid;
}

// Show or hide password
if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';

        passwordInput.type = isPassword ? 'text' : 'password';

        togglePassword.textContent = isPassword ? 'Hide' : 'Show';

        togglePassword.setAttribute(
            'aria-label',
            isPassword ? 'Hide password' : 'Show password'
        );
    });
}

// Login using Flask backend
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!validate(email, password)) {
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            loginError.textContent =
                result.message || 'Invalid email or password.';
            return;
        }

        const user = result.data;

        if (!user || !user.id || !user.role) {
            loginError.textContent =
                'Invalid user information received from server.';
            return;
        }

        const role = String(user.role).toLowerCase();

        const userSession = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: role,
            loginAt: Date.now()
        };

        // Store authenticated user information
        sessionStorage.setItem(
            USER_KEY,
            JSON.stringify(userSession)
        );

        // Redirect according to account role
        if (role === 'student') {

            sessionStorage.setItem(
                STUDENT_KEY,
                JSON.stringify(userSession)
            );

            window.location.href = '/dashboard.html';

        } else if (role === 'admin' || role === 'administrator') {

            sessionStorage.removeItem(STUDENT_KEY);

            window.location.href = '/admin.html';

        } else {

            sessionStorage.removeItem(USER_KEY);

            loginError.textContent = 'Unsupported account role.';
        }

    } catch (error) {

        console.error('Login error:', error);

        loginError.textContent =
            'Unable to connect to the server. Please try again.';

    } finally {

        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});
