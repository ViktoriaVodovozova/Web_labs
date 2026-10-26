import { useState, useRef } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/authApi';
import { authErrors } from '../services/validation';
import { ErrorMessage, Field } from '../components/Common';

export default function AuthPage({ register = false }) {
  const { session } = useApp();
  const [value, setValue] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const target = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !['/login', '/register'].includes(from) ? from : '/students';
  if (session) return <Navigate to={target} replace/>;
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    const problems = authErrors(value, register); setErrors(problems); setError(null);
    if (Object.keys(problems).length) return;
    lock.current = true; setBusy(true);
    try {
      const payload = { username: value.username, password: value.password };
      if (register) payload.email = value.email;
      await (register ? authApi.register(payload) : authApi.login(payload));
      navigate(target, { replace: true });
    } catch (error) { setError(error); setErrors(error.detail || {}); }
    finally { lock.current = false; setBusy(false); }
  }
  const inputs = [['username', 'Имя пользователя', 'text'], ...(register ? [['email', 'Email', 'email']] : []), ['password', 'Пароль', 'password'], ...(register ? [['confirm', 'Повторите пароль', 'password']] : [])];
  return <div className="auth-layout"><section className="auth-intro"><span className="eyebrow">ЕДИНОЕ ПРОСТРАНСТВО</span><h1>Все студенты.<br/>В одном месте.</h1><p>Список, заселение и подробная информация — без лишних действий.</p><div className="intro-mark">С<span>01 / СТУДЕНЧЕСКИЙ УЧЁТ</span></div></section>
    <section className="card auth-card"><span className="eyebrow">{register ? 'НОВЫЙ АККАУНТ' : 'С ВОЗВРАЩЕНИЕМ'}</span><h2>{register ? 'Регистрация' : 'Вход в систему'}</h2><p className="muted">{register ? 'После регистрации доступен просмотр студентов.' : 'Войдите, чтобы открыть список студентов.'}</p>
      <ErrorMessage error={error}/><form onSubmit={submit} noValidate aria-busy={busy}>
        {inputs.map(([name, label, type]) => <Field key={name} name={name} label={label} error={errors[name]}><input id={name} name={name} type={type} value={value[name]} disabled={busy} required autoComplete={name === 'confirm' ? 'new-password' : name === 'password' ? (register ? 'new-password' : 'current-password') : name} maxLength={name === 'username' ? 50 : name === 'email' ? 254 : 72} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} onChange={event => setValue({ ...value, [name]: event.target.value })}/></Field>)}
        {register && <p className="hint">Имя: латиница, цифры, _. Пароль: от 8 символов и до 72 байт UTF-8.</p>}
        <button className="primary full" disabled={busy}>{busy ? 'Подождите…' : register ? 'Создать аккаунт' : 'Войти'}</button>
      </form><p className="auth-switch">{register ? 'Уже есть аккаунт?' : 'Нет аккаунта?'} <Link to={register ? '/login' : '/register'} state={location.state}>{register ? 'Войти' : 'Зарегистрироваться'}</Link></p>
    </section></div>;
}
