import { pageSizes } from './listConfig';

export default function StudentPagination({ page, size, pages, loading, onPageChange, onSizeChange }) {
  return (
    <div className="pagination">
      <label>
        На странице
        <select value={size} onChange={event => onSizeChange(event.target.value)}>
          {pageSizes.map(value => <option key={value}>{value}</option>)}
        </select>
      </label>
      <div>
        <button disabled={loading || page === 0} onClick={() => onPageChange(page - 1)}>← Назад</button>
        <span>Страница {page + 1} из {Math.max(1, pages)}</span>
        <button disabled={loading || page + 1 >= pages} onClick={() => onPageChange(page + 1)}>Вперёд →</button>
      </div>
    </div>
  );
}
