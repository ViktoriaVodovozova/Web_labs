// Displayed immediately while the students API request is pending.
export default function StudentsSkeleton() {
  return (
    <div className="students-skeleton" role="status" aria-label="Загрузка списка студентов" aria-busy="true">
      <span className="skeleton-line skeleton-count" />
      <div className="skeleton-table">
        <div className="skeleton-row skeleton-head">
          {Array.from({ length: 6 }, (_, i) => <span className="skeleton-line" key={i} />)}
        </div>
        {Array.from({ length: 5 }, (_, row) => (
          <div className="skeleton-row" key={row}>
            {Array.from({ length: 6 }, (_, col) => <span className="skeleton-line" key={col} />)}
          </div>
        ))}
      </div>
      <span className="sr-only">Загрузка студентов…</span>
    </div>
  );
}
