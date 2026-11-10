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
  // Сразу инвалидируем кэш списка и карточек студентов после изменения в Java API.
  updateTag('students');
  revalidatePath('/students'); redirect('/students');
}

export async function updateStudentAction(id, formData) {
  const cookieStore = await cookies(); const token = cookieStore.get('accessToken')?.value;
  const data = { fullName: formData.get('fullName'), group: formData.get('group'), isuId: formData.get('isuId'), dormitory: Number(formData.get('dormitory')), room: Number(formData.get('room')), moveInDate: formData.get('moveInDate'), isForeigner: formData.get('isForeigner') === 'on', notes: formData.get('notes') || '' };
  const res = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/requests/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Ошибка при обновлении');
  // Сразу инвалидируем кэш списка и карточек студентов после изменения в Java API.
  updateTag('students');
  revalidatePath('/students'); revalidatePath(`/students/${id}`); redirect(`/students/${id}`);
}

export async function deleteStudentAction(id) {
  const cookieStore = await cookies(); const token = cookieStore.get('accessToken')?.value;
  const res = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/requests/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Ошибка удаления');
  // Сразу инвалидируем кэш списка и карточек студентов после изменения в Java API.
  updateTag('students');
  revalidatePath('/students'); redirect('/students');
}