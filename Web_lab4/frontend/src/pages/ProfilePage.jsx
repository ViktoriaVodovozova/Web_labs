import { useEffect, useState } from 'react';
import { authApi } from '../services/authApi';
import { useApp } from '../context/AppContext';
import { ErrorMessage, Loading } from '../components/Common';

export default function ProfilePage() {
  const { logout } = useApp();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setProfile(null);
    authApi
      .getProfile(controller.signal)
      .then(setProfile)
      .catch(error => {
        if (error.name !== 'AbortError') setError(error);
      });
    return () => controller.abort();
  }, [retry]);
  return (
    <section className="card narrow">
      <h1>Мой профиль</h1>
      <ErrorMessage error={error} retry={() => setRetry(x => x + 1)} />
      {!profile && !error && <Loading />}
      {profile && (
        <>
          <dl className="details">
            <dt>Имя пользователя</dt>
            <dd>{profile.username}</dd>
            <dt>Email</dt>
            <dd>{profile.email}</dd>
            <dt>Роль</dt>
            <dd>
              {profile.role === 'ADMIN'
                ? 'Администратор — просмотр и изменение записей'
                : 'Пользователь — только просмотр'}
            </dd>
            <dt>ID</dt>
            <dd className="mono">{profile.id}</dd>
          </dl>
          <button onClick={logout}>Выйти из системы</button>
        </>
      )}
    </section>
  );
}
