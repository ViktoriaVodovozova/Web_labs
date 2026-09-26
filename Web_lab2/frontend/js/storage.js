const API_URL = '/api/requests';

export async function getStudents(filters = {}) {
    const params = new URLSearchParams();
    for (const key in filters) {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
            params.append(key, filters[key]);
        }
    }
    const url = params.toString() ? `${API_URL}?${params}` : API_URL;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Ошибка загрузки списка');
    return await res.json();
}

export async function getStudentById(id) {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) return null;
    return await res.json();
}

export async function addStudent(student) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
    });
    if (!res.ok) {
        const err = await res.json();
        throw { status: res.status, errors: err.detail || err };
    }
    return await res.json();
}

export async function updateStudent(id, updated) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
    });
    if (!res.ok) {
        const err = await res.json();
        throw { status: res.status, errors: err.detail || err };
    }
    return await res.json();
}

export async function deleteStudent(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
        throw new Error('Ошибка удаления');
    }
    return true;
}