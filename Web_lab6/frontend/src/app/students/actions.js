'use server';
import { cookies } from 'next/headers';
import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

// Функция для получения правильного URL (внутри Docker — java-backend)
const getBaseUrl = () => process.env.API_BASE_URL || process.env.INTERNAL_API_URL || 'http://java-backend:8000';

export async function createStudentAction(formData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const data = {
    fullName: formData.get('fullName'), group: formData.get('group'), isuId: formData.get('isuId'),
    dormitory: Number(formData.get('dormitory')), room: Number(formData.get('room')),
    moveInDate: formData.get('moveInDate'), isForeigner: formData.get('isForeigner') === 'on',
    notes: formData.get('notes') || ''
  };

  const res = await fetch(`${getBaseUrl()}/api/requests`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Ошибка Java при создании:', res.status, errorText);
    throw new Error(`Ошибка при создании: HTTP ${res.status}`);
  }

  updateTag('students');
  revalidatePath('/students');
  redirect('/students');
}

export async function updateStudentAction(id, formData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const data = {
    fullName: formData.get('fullName'), group: formData.get('group'), isuId: formData.get('isuId'),
    dormitory: Number(formData.get('dormitory')), room: Number(formData.get('room')),
    moveInDate: formData.get('moveInDate'), isForeigner: formData.get('isForeigner') === 'on',
    notes: formData.get('notes') || ''
  };

  // ИСПОЛЬЗУЕМ getBaseUrl() ВМЕСТО localhost
  const res = await fetch(`${getBaseUrl()}/api/requests/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Ошибка Java при обновлении:', res.status, errorText);
    throw new Error(`Ошибка при обновлении: HTTP ${res.status}`);
  }

  updateTag('students');
  revalidatePath('/students');
  revalidatePath(`/students/${id}`);
  redirect(`/students/${id}`);
}

export async function deleteStudentAction(id) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  const res = await fetch(`${getBaseUrl()}/api/requests/${id}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error('Ошибка удаления');

  updateTag('students');
  revalidatePath('/students');
  redirect('/students');
}
export async function refreshStudentCache() {
  const token = (await cookies()).get('accessToken')?.value;
  if (!token) return;
  const response = await fetch(`${getBaseUrl()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (response.ok && (await response.json()).role === 'ADMIN') updateTag('students');
}
