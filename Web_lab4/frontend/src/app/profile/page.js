import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function fetchProfile(token) {
  const res = await fetch('http://localhost:8000/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) redirect('/login');

  const profile = await fetchProfile(token);
  if (!profile) return <div className="alert error">Не удалось загрузить профиль</div>;

  return (
    <section className="card narrow">
      <h1>Мой профиль</h1>
      <dl className="details">
        <dt>Имя пользователя</dt><dd>{profile.username}</dd>
        <dt>Email</dt><dd>{profile.email}</dd>
        <dt>Роль</dt><dd>{profile.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}</dd>
        <dt>ID</dt><dd className="mono">{profile.id}</dd>
      </dl>
    </section>
  );
}