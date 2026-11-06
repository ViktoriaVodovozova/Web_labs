"use client";

export default function Error({ error, reset }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
      <h2>Что-то пошло не так!</h2>
      <p className="muted" style={{ marginBottom: '20px' }}>{error.message}</p>
      <button className="primary" onClick={() => reset()}>Попробовать снова</button>
    </div>
  );
}