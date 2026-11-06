import { cookies } from 'next/headers';
import Link from 'next/link';
import StudentFilters from './components/StudentFilters';

async function fetchStudents(searchParams, token) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) { if (value) query.append(key, value); }
  if (!query.has('page')) query.append('page', '0'); if (!query.has('size')) query.append('size', '10');

  const res = await fetch(`http://localhost:8000/api/requests?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { tags: ['students'] }
  });

  if (!res.ok) throw new Error('Ошибка загрузки');

  return {
    data: await res.json(),
    total: res.headers.get('X-Total-Count') || '0',
    totalPages: res.headers.get('X-Total-Pages') || '1',
    currentPage: res.headers.get('X-Page') || '0'
  };
}

export default async function StudentsPage({ searchParams }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const role = cookieStore.get('role')?.value;
  const isAdmin = role === 'ADMIN';

  const params = await searchParams;
  let studentsData;

  try {
    studentsData = await fetchStudents(params, token);
    } catch (error) {
    return <div className="alert error">Настоящая ошибка: {error.message}</div>;
  }

  const { data: students, total, totalPages, currentPage } = studentsData;

  const createPageLink = (newPage) => {
    const newParams = new URLSearchParams(params);
    newParams.set('page', newPage.toString());
    return `/students?${newParams.toString()}`;
  };

  return (
    <section className="card">
      <div className="toolbar" style={{ justifyContent: 'space-between', paddingBottom: '10px' }}>
        <h2>Список студентов</h2>
        <span className="badge">Всего: {total}</span>
        {isAdmin && <Link href="/students/new" className="btn-add">Добавить студента</Link>}
      </div>

      {/* ВОТ ОНИ, ФИЛЬТРЫ! */}
      <StudentFilters />

      {students.length > 0 ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ФИО</th><th>Группа</th><th>ИСУ ID</th><th>Общежитие</th><th>Комната</th><th>Дата заселения</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td><Link href={`/students/${student.id}`}>{student.fullName}</Link></td>
                  <td>{student.group}</td>
                  <td>{student.isuId}</td>
                  <td>{student.dormitory}</td>
                  <td>{student.room}</td>
                  <td>{student.moveInDate?.split('-').reverse().join('.')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">Студенты не найдены.</p>
      )}

      <div className="pagination">
        <div>
          {Number(currentPage) > 0 ? (
            <Link href={createPageLink(Number(currentPage) - 1)} className="button">← Назад</Link>
          ) : (
            <button disabled>← Назад</button>
          )}

          <span>Страница {Number(currentPage) + 1} из {totalPages}</span>

          {Number(currentPage) + 1 < Number(totalPages) ? (
            <Link href={createPageLink(Number(currentPage) + 1)} className="button">Вперёд →</Link>
          ) : (
            <button disabled>Вперёд →</button>
          )}
        </div>
      </div>
    </section>
  );
}