import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { deleteStudentAction } from '../actions';

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
    console.error('STUDENT DETAIL FETCH FAILED:', error);
    return { kind: 'unavailable' };
  }
}

export default async function StudentDetailPage({ params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) redirect('/login');

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
  const me = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'QUERY',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
    cache: 'no-store'
  });

  if (me.status === 401 || me.status === 403) redirect('/login');
  const isAdmin = me.ok && (await me.json()).role === 'ADMIN';

  const { id } = await params;
  const result = await fetchStudent(id, token);
  if (result.kind === 'unauthorized') redirect('/login');
  if (result.kind === 'missing') return (
    <section className="card narrow">
      <h2>Студент уже удалён или не найден</h2>
      <p>Запись могла быть удалена другим пользователем.</p>
      <Link href="/students" className="button primary">Вернуться к списку</Link>
    </section>
  );
  if (result.kind === 'unavailable') return (
    <section className="card narrow">
      <h2>Не удалось загрузить студента</h2>
      <p>Сервер временно недоступен{result.status ? ` (HTTP ${result.status})` : ''}. Попробуйте открыть страницу снова.</p>
      <Link href="/students" className="button">К списку студентов</Link>
    </section>
  );
  const student = result.student;

  const deleteActionWithId = deleteStudentAction.bind(null, id);

  return (
    <>
      <Link className="back-link" href="/students">← К списку</Link>
      <section className="card narrow">
        <h1>{student.fullName}</h1>
        <dl className="details">
          <dt>Группа</dt><dd>{student.group}</dd>
          <dt>ИСУ ID</dt><dd className="mono">{student.isuId}</dd>
          <dt>Общежитие</dt><dd>{student.dormitory}</dd>
          <dt>Комната</dt><dd>{student.room}</dd>
          <dt>Дата заселения</dt><dd>{student.moveInDate?.split('-').reverse().join('.')}</dd>
          <dt>Иностранец</dt><dd>{student.isForeigner ? 'Да' : 'Нет'}</dd>
          <dt>Заметки</dt><dd className="preserve">{student.notes || '—'}</dd>
          <dt>ID записи</dt><dd className="mono">{student.id}</dd>
        </dl>

        {isAdmin && (
          <div className="form-actions">
            <Link href={`/students/${id}/edit`} className="button primary">Редактировать</Link>
            <form action={deleteActionWithId}>
              <button type="submit" className="danger">Удалить</button>
            </form>
          </div>
        )}
      </section>
    </>
  );
}