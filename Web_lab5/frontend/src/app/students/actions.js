'use server';
import { cookies } from 'next/headers';
import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createStudentAction(formData) {
  const cookieStore = await cookies(); const token = cookieStore.get('accessToken')?.value;
  const data = { fullName: formData.get('fullName'), group: formData.get('group'), isuId: formData.get('isuId'), dormitory: Number(formData.get('dormitory')), room: Number(formData.get('room')), moveInDate: formData.get('moveInDate'), isForeigner: formData.get('isForeigner') === 'on', notes: formData.get('notes') || '' };
  const res = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
  if (!res.ok) {
    const details = await res.text();
    console.error('CREATE STUDENT ERROR:', res.status, details);
    throw new Error(`Ошибка при создании: HTTP ${res.status}`);
  }
  updateTag('students');
  revalidatePath('/students'); redirect('/students');
}

export async function updateStudentAction(id, previousState, formData) {
  const cookieStore = await cookies(); const token = cookieStore.get('accessToken')?.value;
  const data = { fullName: formData.get('fullName'), group: formData.get('group'), isuId: formData.get('isuId'), dormitory: Number(formData.get('dormitory')), room: Number(formData.get('room')), moveInDate: formData.get('moveInDate'), isForeigner: formData.get('isForeigner') === 'on', notes: formData.get('notes') || '' };
  const res = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/requests/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'If-Match': String(formData.get('version')) }, body: JSON.stringify(data) });
  if (!res.ok) {
    if (res.status === 404) return { error: 'Студент уже удалён другим пользователем. Вернитесь к списку.' };
    if (res.status === 409) return { error: 'Студент был изменён другим пользователем. Обновите страницу перед сохранением.' };
    if (res.status === 401 || res.status === 403) return { error: 'Нет доступа. Войдите снова.' };
    return { error: `Не удалось сохранить изменения (HTTP ${res.status}).` };
  }
  updateTag('students');
  revalidatePath('/students'); revalidatePath(`/students/${id}`); redirect(`/students/${id}`);
}

export async function deleteStudentAction(id) {
  const cookieStore = await cookies(); const token = cookieStore.get('accessToken')?.value;
  const res = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/requests/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok && res.status !== 404) {
    console.error('DELETE STUDENT ERROR:', res.status);
    redirect('/students?notice=delete-failed');
  }
  updateTag('students');
  revalidatePath('/students'); redirect('/students');
}