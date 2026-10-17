import { apiFetch } from './auth.js';
const API_URL = '/api/requests';

async function readResponse(response) {
    if (!response.ok) throw await response.json();
    return response.status === 204 ? null : response.json();
}

export async function getStudents(filters = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined && value !== '') params.set(key, value);
    }
    const response = await apiFetch(`${API_URL}?${params}`);
    const students = await readResponse(response);
    return { students, total: Number(response.headers.get('X-Total-Count')),
        pages: Number(response.headers.get('X-Total-Pages')) };
}

export async function getStudentById(id) {
    const response = await apiFetch(`${API_URL}/${encodeURIComponent(id)}`);
    if (response.status === 404) return null;
    return readResponse(response);
}

export async function addStudent(student) {
    return readResponse(await apiFetch(API_URL, { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(student) }));
}

export async function updateStudent(id, updated) {
    return readResponse(await apiFetch(`${API_URL}/${encodeURIComponent(id)}`, { method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }));
}

export async function deleteStudent(id) {
    return readResponse(await apiFetch(`${API_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}
