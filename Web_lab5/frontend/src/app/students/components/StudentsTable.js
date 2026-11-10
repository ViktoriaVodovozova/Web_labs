import Link from 'next/link';

async function fetchStudents(searchParams, token) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (typeof value === 'string' && value) query.append(key, value);
  }
  if (!query.has('page')) query.set('page', '0');
  if (!query.has('size')) query.set('size', '10');

  const res = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/requests?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    // Кэш Next.js: 60 секунд; ключ учитывает URL и заголовок Authorization.
    // Тег позволяет сразу сбросить кэш после CRUD-операций.
    next: { revalidate: 60, tags: ['students'] }
  });
  if (!res.ok) throw new Error(`Ошибка загрузки студентов: HTTP ${res.status}`);
  return {
    data: await res.json(),
    total: res.headers.get('X-Total-Count') || '0',
    totalPages: res.headers.get('X-Total-Pages') || '1',
    currentPage: res.headers.get('X-Page') || '0'
  };
}

// Async Server Component: the table streams in after its backend request completes.
export default async function StudentsTable({ searchParams, token }) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const params = await searchParams;
  let studentsData;
  try {
    studentsData = await fetchStudents(params, token);
  } catch (error) {
    return <div className="alert error">Не удалось загрузить студентов: {error.message}</div>;
  }

  const { data: students, total, totalPages, currentPage } = studentsData;
  const createPageLink = (newPage) => {
    const newParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params || {})) {
      if (typeof value === 'string') newParams.set(key, value);
    }
    newParams.set('page', String(newPage));
    return `/students?${newParams.toString()}`;
  };

  return (
    <div>
      <p className="students-count">Всего студентов: <strong>{total}</strong></p>
      {students.length > 0 ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>ФИО</th><th>Группа</th><th>ИСУ ID</th><th>Общежитие</th><th>Комната</th><th>Дата заселения</th></tr>
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
      ) : <p className="empty">Студенты не найдены.</p>}
      <div className="pagination">
        <div>
          {Number(currentPage) > 0 ?
            <Link href={createPageLink(Number(currentPage) - 1)} className="button">← Назад</Link> :
            <button disabled>← Назад</button>}
          <span>Страница {Number(currentPage) + 1} из {totalPages}</span>
          {Number(currentPage) + 1 < Number(totalPages) ?
            <Link href={createPageLink(Number(currentPage) + 1)} className="button">Вперёд →</Link> :
            <button disabled>Вперёд →</button>}
        </div>
      </div>
    </div>
  );
}
