import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import EditStudentForm from '../../components/EditStudentForm';

async function fetchStudent(id, token) {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${baseUrl}/api/requests/${encodeURIComponent(id)}`, {
      method: 'QUERY',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store'
    });
    if (res.status === 404) return { kind: 'missing' };
    if (res.status === 401 || res.status === 403) return { kind: 'unauthorized' };
    if (!res.ok) return { kind: 'unavailable', status: res.status };
    return { kind: 'ok', student: await res.json() };
  } catch (error) {
    console.error('STUDENT EDIT FETCH FAILED:', error);
    return { kind: 'unavailable' };
  }
}

export default async function EditStudentPage({ params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) redirect('/login');

  const { id } = await params;
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';

  const me = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'QUERY',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
    cache: 'no-store'
  });

  if (!me.ok || (await me.json()).role !== 'ADMIN') redirect('/students');

  const result = await fetchStudent(id, token);
  if (result.kind === 'unauthorized') redirect('/login');
  if (result.kind === 'missing') return <div className="alert error">Студент был удалён другим пользователем или не найден. <a href="/students">К списку</a></div>;
  if (result.kind === 'unavailable') return <div className="alert error">Не удалось загрузить студента{result.status ? ` (HTTP ${result.status})` : ''}. <a href="/students">К списку</a></div>;

  return <EditStudentForm student={result.student} />;
}
