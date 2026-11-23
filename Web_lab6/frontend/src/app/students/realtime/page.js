import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RealtimePanel from './RealtimePanel';

export default async function RealtimePage() {
  const token = (await cookies()).get('accessToken')?.value;
  if (!token) redirect('/login');

  const base = process.env.INTERNAL_API_URL || 'http://java-backend:8000';
  const response = await fetch(`${base}/api/auth/me`, {
    method: 'QUERY', headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if ([401, 403].includes(response.status)) redirect('/login');
  if (!response.ok) throw new Error('Проверка доступа недоступна');
  if ((await response.json()).role !== 'ADMIN') redirect('/students');

  return <RealtimePanel />;
}
