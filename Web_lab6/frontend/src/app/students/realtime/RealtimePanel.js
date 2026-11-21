'use client';

import { useEffect, useState } from 'react';

const actions = {
  STUDENT_CREATED: 'Добавление',
  STUDENT_UPDATED: 'Изменение',
  STUDENT_DELETED: 'Удаление',
  STUDENT_IMPORT: 'Импорт CSV',
};
const states = { queued: 'В очереди', running: 'Выполняется', done: 'Завершено', failed: 'Ошибка' };
const pageSize = 20;

async function realtime(path, init) {
  const response = await fetch('/rt' + path, { cache: 'no-store', ...init });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ошибка сервиса');
  return data;
}

export default function RealtimePanel() {
  const [offset, setOffset] = useState(0);
  const [audit, setAudit] = useState(null);
  const [auditError, setAuditError] = useState('');
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [jobError, setJobError] = useState('');
  const jobId = job?.id;
  const active = job && !['done', 'failed'].includes(job.state);

  useEffect(() => {
    let controller;
    async function load() {
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      try {
        const result = await realtime(`/audit?offset=${offset}&limit=${pageSize}`, { signal });
        if (signal.aborted) return;
        setAudit(result);
        setAuditError('');
      } catch (error) {
        if (!signal.aborted) setAuditError(error.message);
      }
    }
    load();
    window.addEventListener('student-audit-update', load);
    return () => {
      controller?.abort();
      window.removeEventListener('student-audit-update', load);
    };
  }, [offset]);

  useEffect(() => {
    if (!jobId || !active) return;
    const controller = new AbortController();
    function accept(next) {
      setJob((current) => {
        if (current.id !== next.id || ['done', 'failed'].includes(current.state)) return current;
        if (next.progress.processed < current.progress.processed) return current;
        return next;
      });
      if (next.type === 'import' && next.state === 'done') {
        window.dispatchEvent(new Event('student-audit-update'));
      }
    }
    const onUpdate = (event) => { if (event.detail.id === jobId) accept(event.detail); };
    async function sync() {
      try {
        const next = await realtime(`/jobs/${jobId}`, { signal: controller.signal });
        if (!controller.signal.aborted) accept(next);
      } catch (error) {
        if (!controller.signal.aborted) setJobError(error.message);
      }
    }
    window.addEventListener('student-job-update', onUpdate);
    sync();
    const timer = setInterval(sync, 2000);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener('student-job-update', onUpdate);
    };
  }, [jobId, active]);

  async function start(type, path, body) {
    setBusy(true);
    setJobError('');
    try {
      const { jobId: id } = await realtime(path, { method: 'POST', body });
      setJob({ id, type, state: 'queued', progress: { processed: 0 }, errors: [] });
    } catch (error) {
      setJobError(error.message);
    } finally {
      setBusy(false);
    }
  }

  function submitImport(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    start('import', `/import?onConflict=${form.get('onConflict')}`, form.get('csv'));
  }

  return (
    <>
      <section className="card">
        <h2>Импорт и экспорт CSV</h2>
        <form onSubmit={submitImport}>
          <div className="field"><label htmlFor="csv">Файл CSV</label><input id="csv" name="csv" type="file" accept=".csv,text/csv" required /></div>
          <div className="field">
            <label htmlFor="conflict">Если студент уже есть</label>
            <select id="conflict" name="onConflict">
              <option value="skip">Пропустить</option>
              <option value="update">Обновить</option>
              <option value="fail">Отметить строку как ошибку</option>
            </select>
          </div>
          <button className="primary" disabled={busy || active}>Импортировать</button>{' '}
          <button type="button" disabled={busy || active} onClick={() => start('export', '/export')}>Подготовить экспорт</button>
        </form>
        {jobError && <p role="alert">{jobError}</p>}
        {job && (
          <div>
            <p role="status">{states[job.state]}. Обработано строк: {job.progress.processed}</p>
            {job.type === 'import' && job.progress.created !== undefined &&
              <p>Добавлено {job.progress.created}, обновлено {job.progress.updated}, пропущено {job.progress.skipped}, ошибок {job.progress.failed}.</p>}
            {job.error && <p role="alert">{job.error}</p>}
            {job.errors.length > 0 && <ul>{job.errors.map((error) => <li key={error.row}>Строка {error.row}. {error.message}</li>)}</ul>}
            {job.downloadReady && <a href={`/rt/jobs/${job.id}/file`}>Скачать CSV</a>}
          </div>
        )}
      </section>
      <section className="card">
        <h2>Журнал действий</h2>
        {auditError && <p role="alert">{auditError}</p>}
        {!audit && !auditError && <p role="status">Загрузка журнала…</p>}
        {audit?.total === 0 && <p>Записей пока нет.</p>}
        {audit?.total > 0 && (
          <>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Дата и время</th><th>Действие</th><th>Пользователь</th><th>Запись</th></tr></thead>
                <tbody>{audit.items.map((entry) => (
                  <tr key={entry.eventId}>
                    <td>{new Date(entry.occurredAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</td>
                    <td>{actions[entry.action] || entry.action}</td><td>{entry.actor.username}</td>
                    <td>{entry.after?.fullName || entry.before?.fullName || entry.entityId}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <p>
              <button disabled={!offset} onClick={() => setOffset(offset - pageSize)}>Назад</button>{' '}
              <button disabled={offset + pageSize >= audit.total} onClick={() => setOffset(offset + pageSize)}>Дальше</button>
            </p>
          </>
        )}
      </section>
    </>
  );
}
