export default function Loading() {
  return (
    <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <p className="loading" role="status">
        <span className="spinner" /> Загрузка студентов…
      </p>
    </div>
  );
}