import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import StudentsView from './components/StudentsView';
import StudentsTable from './components/StudentsTable';
import StudentsSkeleton from './components/StudentsSkeleton';

// This page sends its shell first. Slow backend requests run inside separate
// async Server Components, so Suspense can stream their HTML when ready.
export default async function StudentsPage({ searchParams }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) redirect('/login');

  const me = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8000'}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (me.status === 401 || me.status === 403) redirect('/login');
  if (!me.ok) throw new Error(`Ошибка проверки пользователя: HTTP ${me.status}`);
  const isAdmin = (await me.json()).role === 'ADMIN';

  // Passing the promise lets the page shell render without waiting for query params.
  return (
    <section className="card">
      <div className="toolbar" style={{ justifyContent: 'space-between', paddingBottom: '10px' }}>
        <h2>Список студентов</h2>
        {isAdmin && <Link href="/students/new" className="btn-add">Добавить студента</Link>}
      </div>

      <Suspense fallback={<StudentsSkeleton />}>
        <StudentsView>
          <Suspense
            key={JSON.stringify((await searchParams) ?? {})}
            fallback={<StudentsSkeleton />}
          >
            <StudentsTable searchParams={searchParams} token={token} />
          </Suspense>
        </StudentsView>
      </Suspense>


    </section>
  );
}
