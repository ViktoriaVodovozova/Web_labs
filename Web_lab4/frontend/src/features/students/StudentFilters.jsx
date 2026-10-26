import { filterFields, sortFields } from './listConfig';

export default function StudentFilters({ query, onChange, onReset }) {
  return (
    <section className="card filters" aria-label="Поиск и фильтры">
      <label className="search-label" htmlFor="search">
        Поиск по ФИО, группе, ИСУ ID, ID и заметкам
      </label>
      <input
        className="search" id="search" type="search"
        value={query.search} placeholder="Начните вводить…" maxLength={5000}
        onChange={event => onChange('search', event.target.value)}
      />
      <details>
        <summary>Фильтры по всем полям</summary>
        <div className="filter-grid">
          {filterFields.map(([name, label, type]) => (
            <div className="field" key={name}>
              <label htmlFor={`filter-${name}`}>{label}</label>
              <input
                id={`filter-${name}`} type={type} value={query[name]}
                min={type === 'number' ? '1' : undefined}
                step={type === 'number' ? '1' : undefined}
                onChange={event => onChange(name, event.target.value)}
              />
            </div>
          ))}
          <div className="field">
            <label htmlFor="filter-isForeigner">Иностранец</label>
            <select id="filter-isForeigner" value={query.isForeigner}
              onChange={event => onChange('isForeigner', event.target.value)}>
              <option value="">Все</option>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          </div>
        </div>
        <p className="hint">
          Текстовые поля — вхождение без учёта регистра. Числа, дата и признак
          иностранца — точное совпадение. Фильтры применяются вместе.
        </p>
      </details>
      <div className="toolbar">
        <div className="inline-field">
          <label htmlFor="sortBy">Сортировать</label>
          <select id="sortBy" value={query.sortBy}
            onChange={event => onChange('sortBy', event.target.value)}>
            {sortFields.map(([name, label]) => <option key={name} value={name}>{label}</option>)}
          </select>
          <select aria-label="Направление сортировки" value={query.direction}
            onChange={event => onChange('direction', event.target.value)}>
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </div>
        <button className="ghost" onClick={onReset}>Сбросить фильтры</button>
      </div>
    </section>
  );
}
