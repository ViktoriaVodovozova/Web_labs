let refreshing = null;

export function getSession() {
    try { return JSON.parse(sessionStorage.getItem('session')); }
    catch { return null; }
}

export function saveSession(data) {
    sessionStorage.setItem('session', JSON.stringify(data));
}

export function logout() {
    sessionStorage.removeItem('session');
    window.location.href = 'login.html';
}

export function isAdmin() { return getSession()?.role === 'ADMIN'; }

export function requireLogin() {
    if (!getSession()) {
        window.location.replace('login.html');
        return false;
    }
    const nav = document.getElementById('user-nav');
    nav.textContent = `${getSession().username} (${getSession().role}) `;
    const button = document.createElement('button');
    button.textContent = 'Выйти';
    button.addEventListener('click', logout);
    nav.append(button);
    return true;
}

export function errorText(error) {
    return error.detail ? Object.values(error.detail).join('\n') : error.message || 'Ошибка запроса';
}

export async function authRequest(path, data) {
    const response = await fetch('/api/auth/' + path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw { ...result, status: response.status };
    return result;
}

async function refresh() {
    if (!refreshing) {
        refreshing = authRequest('refresh', { refreshToken: getSession()?.refreshToken })
            .then(saveSession).finally(() => { refreshing = null; });
    }
    return refreshing;
}

export async function apiFetch(url, options = {}) {
    const send = () => fetch(url, {
        ...options, headers: { ...options.headers, Authorization: 'Bearer ' + getSession()?.accessToken }
    });
    let response = await send();
    if (response.status === 401 && getSession()?.refreshToken) {
        try { await refresh(); }
        catch (error) {
            if (error.status === 401 || error.status === 422) {
                logout();
                throw new Error('Сессия истекла. Войдите повторно');
            }
            throw error;
        }
        response = await send();
    }
    if (response.status === 401) {
        logout();
        throw new Error('Необходима авторизация');
    }
    return response;
}
