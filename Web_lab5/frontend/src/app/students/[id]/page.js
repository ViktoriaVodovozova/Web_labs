import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deleteStudentAction } from '../actions';

async function fetchStudent(id, token) {
  const res = await fetch(`http://localhost:8000/api/requests/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Ошибка');
  return res.json();
}

export default async function StudentDetailPage({ params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const role = cookieStore.get('role')?.value;
  const isAdmin = role === 'ADMIN';

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