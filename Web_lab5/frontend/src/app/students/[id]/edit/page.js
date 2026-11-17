import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { updateStudentAction } from '../../actions';

async function fetchStudent(id, token) {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';

  const res = await fetch(`${baseUrl}/api/requests?id=${id}`, {
    method: 'QUERY',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
    next: { revalidate: 60, tags: ['students'] }
  });

  if (!res.ok) return null;

  const data = await res.json();

  return data.length > 0 ? data[0] : null;
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

  const student = await fetchStudent(id, token);
  if (!student) return <div className="alert error">Студент не найден</div>;

  const updateActionWithId = updateStudentAction.bind(null, id);

  return (
    <section className="card narrow"><h2>Редактировать студента</h2>
      <form action={updateActionWithId} className="form-grid">
        <div className="field"><label>ФИО *</label><input type="text" name="fullName" required defaultValue={student.fullName} maxLength={200} /></div>
        <div className="field"><label>Группа *</label><input type="text" name="group" required defaultValue={student.group} maxLength={100} /></div>
        <div className="field"><label>ИСУ ID *</label><input type="text" name="isuId" required defaultValue={student.isuId} pattern="[0-9]{6}" title="Ровно 6 цифр" /></div>
        <div className="field"><label>Общежитие *</label><input type="number" name="dormitory" required defaultValue={student.dormitory} min="1" /></div>
        <div className="field"><label>Комната *</label><input type="number" name="room" required defaultValue={student.room} min="1" /></div>
        <div className="field"><label>Дата заселения *</label><input type="date" name="moveInDate" required defaultValue={student.moveInDate} /></div>
        <div className="field span-all"><label className="checkbox"><input type="checkbox" name="isForeigner" defaultChecked={student.isForeigner} /> Иностранный студент</label></div>
        <div className="field span-all"><label>Заметки</label><textarea name="notes" rows="4" defaultValue={student.notes} maxLength={5000}></textarea></div>
        <div className="form-actions span-all"><button type="submit" className="primary">Сохранить</button><Link href={`/students/${id}`} className="button">Отмена</Link></div>
      </form>
    </section>
  );
}