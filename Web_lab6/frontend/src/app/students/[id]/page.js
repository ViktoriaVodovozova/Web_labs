import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { deleteStudentAction } from '../actions';

async function fetchStudent(id, token) {
  const baseUrl = process.env.API_BASE_URL || process.env.INTERNAL_API_URL || 'http://java-backend:8000';

  const res = await fetch(`${baseUrl}/api/requests/${encodeURIComponent(id)}`, {
    method: 'QUERY', headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  if (res.status === 404 || res.status === 401) return null;
  if (!res.ok) throw new Error(`Ошибка API: ${res.status}`);

  const data = await res.json();
  return Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
}

export default async function StudentDetailPage({ params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) redirect('/login');

  const baseUrl = process.env.API_BASE_URL || process.env.INTERNAL_API_URL || 'http://java-backend:8000';
  const me = await fetch(`${baseUrl}/api/auth/me`, {
    method: 'QUERY', headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });


  if (me.status === 401 || me.status === 403) redirect('/login');
  const isAdmin = me.ok && (await me.json()).role === 'ADMIN';

  const { id } = await params;
  const student = await fetchStudent(id, token);
  if (!student) notFound();

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