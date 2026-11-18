import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import StudentFilters from './components/StudentFilters';
import StudentsTable from './components/StudentsTable';
import StudentsSkeleton from './components/StudentsSkeleton';

export default async function StudentsPage({ searchParams }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const role = cookieStore.get('role')?.value;
  const isAdmin = role === 'ADMIN';
  const query = await searchParams;

  return (
    <section className="card">
      <div className="toolbar" style={{ justifyContent: 'space-between', paddingBottom: '10px' }}>
        <h2>Список студентов</h2>
        {isAdmin && <Link href="/students/new" className="btn-add">Добавить студента</Link>}
      </div>

      {query?.notice === 'delete-failed' && <div className="alert error" role="alert">Не удалось удалить запись. Обновите страницу и повторите попытку.</div>}
      <StudentFilters />

      <Suspense fallback={<StudentsSkeleton />}>
        <StudentsTable searchParams={searchParams} token={token} />
      </Suspense>
    </section>
  );
}