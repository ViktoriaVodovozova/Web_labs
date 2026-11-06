import { useState, useRef } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/authApi';
import { authErrors } from '../services/validation';
import { ErrorMessage, Field } from '../components/Common';

export default function AuthPage({ register = false }) {
  const { session } = useApp();
  const [value, setValue] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(([name]) => submitted || touched[name])
  );
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const target =
    typeof from === 'string' &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    !['/login', '/register'].includes(from)
      ? from
      : '/students';
  if (session) return <Navigate to={target} replace />;
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    setSubmitted(true);
    const problems = authErrors(value, register);
    setErrors(problems);
    setError(null);
    if (Object.keys(problems).length) return;
    lock.current = true;
    setBusy(true);
    try {
      const payload = { username: value.username, password: value.password };
      if (register) payload.email = value.email;
      await (register ? authApi.register(payload) : authApi.login(payload));
      navigate(target, { replace: true });
    } catch (error) {
      setError(error);
      setErrors(error.detail || {});
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const inputs = [
    ['username', 'Имя пользователя', 'text'],
    ...(register ? [['email', 'Email', 'email']] : []),
    ['password', 'Пароль', 'password'],
    ...(register ? [['confirm', 'Повторите пароль', 'password']] : []),
  ];
  return (
    <div className="auth-layout">
      <section className="card auth-card">
        <h2>{register ? 'Регистрация' : 'Вход'}</h2>
        <ErrorMessage error={error} />
        <form
          onSubmit={submit}
          onBlur={event => {
            const name = event.target.name;
            if (name in value) {
              setTouched(old => ({ ...old, [name]: true }));
              const message = authErrors(value, register)[name];
              setErrors(old => ({ ...old, [name]: message }));
            }
          }}
          noValidate
          aria-busy={busy}
        >
          {inputs.map(([name, label, type]) => (
            <Field key={name} name={name} label={label} error={visibleErrors[name]}>
              <input
                id={name}
                name={name}
                type={type}
                value={value[name]}
                disabled={busy}
                required
                autoComplete={
                  name === 'confirm'
                    ? 'new-password'
                    : name === 'password'
                      ? register
                        ? 'new-password'
                        : 'current-password'
                      : name
                }
                maxLength={name === 'username' ? 50 : name === 'email' ? 254 : 72}
                aria-invalid={!!visibleErrors[name]}
                aria-describedby={visibleErrors[name] ? `${name}-error` : undefined}
                onChange={event => {
                  const next = { ...value, [name]: event.target.value };
                  setValue(next);
                  setErrors(authErrors(next, register));
                  setError(null);
                }}
              />
            </Field>
          ))}
          <button className="primary full" disabled={busy}>
            {busy ? 'Подождите…' : register ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>
        <p className="auth-switch">
          {register ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
          <Link to={register ? '/login' : '/register'} state={location.state}>
            {register ? 'Войти' : 'Зарегистрироваться'}
          </Link>
        </p>
      </section>
    </div>
  );
}
