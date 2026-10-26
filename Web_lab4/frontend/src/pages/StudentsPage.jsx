import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useStudents } from '../hooks/useStudents';
import { ErrorMessage, Loading } from '../components/Common';
import StudentFilters from '../features/students/StudentFilters';
import StudentTable from '../features/students/StudentTable';
import StudentPagination from '../features/students/StudentPagination';
import {
  filterFields,
  sortFields,
  pageSizes,
} from '../features/students/listConfig';

function nonnegative(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

export default function StudentsPage() {
  const { isAdmin, revision, changed } = useApp();
  const [params, setParams] = useSearchParams();
  const query = useMemo(
    () => ({
      search: params.get('search') || '',
      ...Object.fromEntries(
        filterFields.map(([name]) => [name, params.get(name) || ''])
      ),
      isForeigner: params.get('isForeigner') || '',
      page: nonnegative(params.get('page'), 0),
      size: pageSizes.includes(Number(params.get('size')))
        ? Number(params.get('size'))
        : 10,
      sortBy: sortFields.some(([name]) => name === params.get('sortBy'))
        ? params.get('sortBy')
        : 'fullName',
      direction: params.get('direction') === 'desc' ? 'desc' : 'asc',
    }),
    [params]
  );
  const state = useStudents(query, revision);

  function change(name, value, resetPage = true) {
    setParams(
      old => {
        const next = new URLSearchParams(old);
        value === '' ? next.delete(name) : next.set(name, value);
        if (resetPage) next.set('page', '0');
        return next;
      },
      { replace: true }
    );
  }

  useEffect(() => {
    const lastPage = Math.max(0, state.pages - 1);
    if (!state.loading && !state.error && query.page > lastPage) {
      change('page', String(lastPage), false);
    }
  }, [state.loading, state.error, state.pages, query.page]);

  return (
    <section
      className="card"
      aria-busy={state.loading}
      aria-label="Список студентов"
    >
      <StudentFilters
        query={query}
        onChange={change}
        onReset={() => setParams({}, { replace: true })}
      >
        {isAdmin && (
          <Link className="button btn-add" to="/students/new">
            Добавить студента
          </Link>
        )}
      </StudentFilters>
      <ErrorMessage error={state.error} retry={changed} />
      {state.loading && <Loading />}
      {!state.loading &&
        !state.error &&
        (state.data.length > 0 ? (
          <StudentTable students={state.data} isAdmin={isAdmin} />
        ) : (
          <p className="empty">Студенты не найдены.</p>
        ))}
      <StudentPagination
        page={query.page}
        size={query.size}
        pages={state.pages}
        loading={state.loading}
        onPageChange={page => change('page', String(page), false)}
        onSizeChange={size => change('size', size)}
      />
    </section>
  );
}
