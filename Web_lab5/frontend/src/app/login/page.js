"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');
      router.push('/students'); router.refresh();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="auth-layout"><section className="card auth-card"><h2>Вход</h2>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleSubmit} aria-busy={busy}>
        <div className="field"><label>Имя пользователя</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} disabled={busy} required /></div>
        <div className="field"><label>Пароль</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} required /></div>
        <button className="primary full" disabled={busy}>{busy ? 'Подождите…' : 'Войти'}</button>
      </form>
      <p className="auth-switch">Нет аккаунта? <Link href="/register">Зарегистрироваться</Link></p>
    </section></div>
  );
}