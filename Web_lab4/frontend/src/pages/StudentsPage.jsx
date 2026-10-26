import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useStudents } from '../hooks/useStudents';
import { ErrorMessage, Loading } from '../components/Common';
import StudentFilters from '../features/students/StudentFilters';
import StudentTable from '../features/students/StudentTable';
import StudentPagination from '../features/students/StudentPagination';
import { filterFields, sortFields, pageSizes } from '../features/students/listConfig';

function nonnegative(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

export default function StudentsPage() {
  const { isAdmin, revision, changed } = useApp();
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => ({
    search: params.get('search') || '',
    ...Object.fromEntries(filterFields.map(([name]) => [name, params.get(name) || ''])),
    isForeigner: params.get('isForeigner') || '',
    page: nonnegative(params.get('page'), 0),
    size: pageSizes.includes(Number(params.get('size'))) ? Number(params.get('size')) : 10,
    sortBy: sortFields.some(([name]) => name === params.get('sortBy')) ? params.get('sortBy') : 'fullName',
    direction: params.get('direction') === 'desc' ? 'desc' : 'asc',
  }), [params]);
  const state = useStudents(query, revision);

  function change(name, value, resetPage = true) {
    setParams(old => {
      const next = new URLSearchParams(old);
      value === '' ? next.delete(name) : next.set(name, value);
      if (resetPage) next.set('page', '0');
      return next;
    }, { replace: true });
  }

  useEffect(() => {
    const lastPage = Math.max(0, state.pages - 1);
    if (!state.loading && !state.error && query.page > lastPage) {
      change('page', String(lastPage), false);
    }
  }, [state.loading, state.error, state.pages, query.page]);

  return <>
    <div className="page-heading">
      <div>
        <span className="eyebrow">СТУДЕНЧЕСКИЙ УЧЁТ</span>
        <h1>Студенты <span className="count">{state.total}</span></h1>
        <p className="muted">Информация о студентах и заселении в общежития.</p>
      </div>
      {isAdmin && <Link className="button primary" to="/students/new">+ Добавить студента</Link>}
    </div>
    <StudentFilters query={query} onChange={change}
      onReset={() => setParams({}, { replace: true })}/>
    <ErrorMessage error={state.error} retry={changed}/>
    <section className="card list-card" aria-busy={state.loading} aria-label="Список студентов">
      <div className="list-top">
        <strong>Список студентов</strong>
        <span className="muted" role="status">{state.loading ? 'Обновление…' : `Найдено: ${state.total}`}</span>
      </div>
      {state.loading && <Loading text="Загрузка студентов…"/>}
      {!state.loading && !state.error && (state.data.length > 0
        ? <StudentTable students={state.data} isAdmin={isAdmin}/>
        : <div className="empty"><h2>Студенты не найдены</h2>
            <p>Измените фильтры{isAdmin ? ' или добавьте первую запись' : ''}.</p>
          </div>)}
      <StudentPagination page={query.page} size={query.size} pages={state.pages} loading={state.loading}
        onPageChange={page => change('page', String(page), false)}
        onSizeChange={size => change('size', size)}/>
    </section>
  </>;
}
