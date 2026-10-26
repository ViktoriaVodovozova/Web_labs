import { filterFields, sortFields } from './listConfig';

export default function StudentFilters({ query, onChange, onReset, children }) {
  const input = ([name, label, type]) => <input key={name} id={`filter-${name}`}
    aria-label={label} placeholder={label} type={type} value={query[name]}
    min={type === 'number' ? '1' : undefined} step={type === 'number' ? '1' : undefined}
    onChange={event => onChange(name, event.target.value)}/>;
  return <>
    <div className="toolbar">
      <input id="search" type="search" aria-label="Поиск" placeholder="Поиск" maxLength={5000}
        value={query.search} onChange={event => onChange('search', event.target.value)}/>
      <select aria-label="Иностранец" value={query.isForeigner}
        onChange={event => onChange('isForeigner', event.target.value)}>
        <option value="">Все</option><option value="true">Иностранцы</option><option value="false">Не иностранцы</option>
      </select>
      <select aria-label="Сортировать" value={query.sortBy} onChange={event => onChange('sortBy', event.target.value)}>
        {sortFields.map(([name, label]) => <option key={name} value={name}>{label}</option>)}
      </select>
      <select aria-label="Направление сортировки" value={query.direction} onChange={event => onChange('direction', event.target.value)}>
        <option value="asc">По возрастанию</option><option value="desc">По убыванию</option>
      </select>
      {filterFields.filter(([name]) => ['group', 'dormitory'].includes(name)).map(input)}
      <button onClick={onReset}>Сбросить</button>
      {children}
    </div>
    <details className="extra-filters">
      <summary>Другие фильтры</summary>
      <div className="toolbar">
        {filterFields.filter(([name]) => !['group', 'dormitory'].includes(name)).map(input)}
      </div>
    </details>
  </>;
}
