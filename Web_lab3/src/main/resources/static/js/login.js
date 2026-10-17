import { authRequest, saveSession, errorText } from './auth.js';

const form = document.getElementById('auth-form');
const error = document.getElementById('auth-error');
const register = document.getElementById('register-mode');

register.addEventListener('change', () => {
    document.getElementById('email-row').hidden = !register.checked;
    document.getElementById('email').required = register.checked;
    document.getElementById('auth-submit').textContent = register.checked ? 'Зарегистрироваться' : 'Войти';
});

form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    const button = document.getElementById('auth-submit');
    button.disabled = true;
    const data = {
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
    };
    if (register.checked) data.email = document.getElementById('email').value.trim();
    try {
        saveSession(await authRequest(register.checked ? 'register' : 'login', data));
        window.location.href = 'index.html';
    } catch (err) { error.textContent = errorText(err); }
    finally { button.disabled = false; }
});
