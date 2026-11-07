"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
export default function RegisterPage() {
  const router = useRouter();
  const [username,setUsername] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,email,password})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Ошибка регистрации');
      router.push('/students'); router.refresh();
    } catch (e) {setError(e.message)} finally {setBusy(false)}
  }
  return <div className="auth-layout"><section className="card auth-card"><h2>Регистрация</h2>
    {error && <div className="alert error">{error}</div>}
    <form onSubmit={submit}>
      <div className="field"><label>Логин</label><input required minLength={3} maxLength={50} pattern="[a-zA-Z0-9_]+" value={username} onChange={e=>setUsername(e.target.value)}/></div>
      <div className="field"><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>
      <div className="field"><label>Пароль (не менее 8 символов)</label><input type="password" required minLength={8} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)}/></div>
      <button className="primary" disabled={busy}>{busy?'Подождите…':'Зарегистрироваться'}</button>
    </form><p>Уже есть аккаунт? <Link href="/login">Войти</Link></p>
  </section></div>;
}
