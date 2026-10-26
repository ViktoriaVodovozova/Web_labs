import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export function ErrorMessage({ error, retry }) {
  if (!error) return null;
  return <div className="alert error" role="alert"><strong>{error.message || error}</strong>
    {error.detail && <ul>{Object.entries(error.detail).filter(([key]) => key !== 'message').map(([key, value]) => <li key={key}>{key}: {value}</li>)}</ul>}
    {retry && <button type="button" onClick={retry}>Повторить</button>}
  </div>;
}
export function Loading({ text = 'Загрузка…' }) { return <p className="loading" role="status"><span className="spinner"/>{text}</p>; }
export function Guard({ admin = false }) {
  const { session, isAdmin } = useApp();
  const location = useLocation();
  if (!session) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace/>;
  if (admin && !isAdmin) return <section className="card"><h1>Доступ ограничен</h1><p>Изменять записи может только администратор.</p><Link to="/students">К списку студентов</Link></section>;
  return <Outlet/>;
}
export function Field({ name, label, error, children }) {
  return <div className="field"><label htmlFor={name}>{label}</label>{children}
    {error && <small id={`${name}-error`} className="field-error">{error}</small>}
  </div>;
}
export function Layout() {
  const { session, logout, undo, undoBusy, mutationBusy, undoDelete, isAdmin, notice, setNotice } = useApp();
  return <><header className="site-header"><div className="header-inner">
    <Link to="/students" className="brand"><span className="brand-icon">С</span><span>Студенты<small>Управление заселением</small></span></Link>
    <nav aria-label="Основная навигация">{session ? <><Link to="/students">Студенты</Link><Link to="/profile">{session.username} <span className="badge">{isAdmin ? 'ADMIN' : 'USER'}</span></Link><button className="ghost" onClick={logout}>Выйти</button></> : <><Link to="/login">Вход</Link><Link to="/register">Регистрация</Link></>}</nav>
  </div></header><main>
    {notice && <div className={`alert ${notice.error ? 'error' : 'success'}`} role="status">{notice.text}<button className="ghost" onClick={() => setNotice(null)} aria-label="Скрыть уведомление">×</button></div>}
    {isAdmin && undo.length > 0 && <div className="alert undo" role="status"><span>Удалён студент «{undo.at(-1).fullName}». {undo.length > 1 && `В истории: ${undo.length}.`}</span><button disabled={mutationBusy} onClick={undoDelete}>{undoBusy ? 'Восстановление…' : 'Отменить удаление'}</button></div>}
    <Outlet/>
  </main><footer>Система управления студентами · Лабораторная работа №4 · React + RxJS</footer></>;
}
