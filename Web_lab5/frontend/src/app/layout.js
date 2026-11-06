import './globals.css';
import Link from 'next/link';
import { cookies } from 'next/headers';
import LogoutButton from '../components/LogoutButton';

export const metadata = { title: 'Управление студентами' };

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  return (
    <html lang="ru">
      <body>
        <header style={{ maxWidth: '1100px', margin: '0 auto 25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}><h1>Управление студентами</h1></Link>
            <nav style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {token ? (
                <>
                  <Link href="/students" style={{ fontWeight: '500', color: '#35548e' }}>Студенты</Link>
                  <Link href="/profile" style={{ fontWeight: '500', color: '#35548e' }}>Профиль</Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" style={{ fontWeight: '500', color: '#35548e' }}>Вход</Link>
                  <Link href="/register" style={{ fontWeight: '500', color: '#35548e' }}>Регистрация</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
