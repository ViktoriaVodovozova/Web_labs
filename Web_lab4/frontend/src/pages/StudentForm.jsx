import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useStudent } from '../hooks/useStudent';
import { useAutosave } from '../hooks/useAutosave';
import { studentsApi } from '../services/studentsApi';
import { draftKey, readDraft, writeDraft, clearDraft } from '../services/drafts';
import { emptyStudent, fields, studentErrors, studentPayload, today } from '../services/validation';
import { ErrorMessage, Loading, Field } from '../components/Common';

export default function StudentFormPage() {
  const { id } = useParams();
  const state = useStudent(id);
  if (state.loading) return <Loading/>;
  if (state.error) return <ErrorMessage error={state.error} retry={state.retry}/>;
  return <StudentForm key={id || 'new'} id={id} initial={state.data || emptyStudent}/>;
}
function StudentForm({ id, initial }) {
  const { session, changed, setNotice } = useApp();
  const key = draftKey(session.username, id);
  const [draft] = useState(() => readDraft(key));
  const [value, setValue] = useState(() => ({ ...emptyStudent, ...initial }));
  const current = useRef(value);
  const [draftOffered, setDraftOffered] = useState(!!draft?.value);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [storageError, setStorageError] = useState(false);
  const [localSaved, setLocalSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const navigate = useNavigate();
  const autosave = useAutosave(
    data => studentsApi.update(id, data),
    (saved) => {
      changed();
      // A slow response must not clear a newer draft or replace current input.
      if (JSON.stringify(studentPayload(current.current)) === JSON.stringify(saved)) clearDraft(key);
    },
  );
  function update(next) {
    current.current = next; setValue(next); setError(null);
    const stored = writeDraft(key, next);
    setLocalSaved(stored); setStorageError(!stored);
    // Saving a draft is synchronous so closing the tab during debounce loses no input.
    const problems = studentErrors(next);
    setErrors(problems);
    if (id) autosave.change(Object.keys(problems).length ? null : studentPayload(next));
  }
  function restoreDraft() {
    setDraftOffered(false); update({ ...emptyStudent, ...draft.value });
  }
  function discardDraft() { clearDraft(key); setDraftOffered(false); }
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    const problems = studentErrors(value); setErrors(problems); setError(null);
    if (Object.keys(problems).length) {
      document.getElementById(Object.keys(problems)[0])?.focus(); return;
    }
    if (id) { autosave.flush(studentPayload(value)); return; }
    lock.current = true; setBusy(true);
    try {
      const student = await studentsApi.create(studentPayload(value));
      clearDraft(key); changed(); setNotice({ text: 'Студент добавлен.' });
      navigate(`/students/${student.id}`);
    } catch (error) { setError(error); setErrors(error.detail || {}); }
    finally { lock.current = false; setBusy(false); }
  }
  const pending = id && ['waiting', 'saving'].includes(autosave.status);
  const blocker = useBlocker(!!pending || busy || !!autosave.error || storageError);
  useEffect(() => {
    if (blocker.state === 'blocked' && !pending && !busy && !autosave.error && !storageError) blocker.proceed();
  }, [blocker, pending, busy, autosave.error, storageError]);
  useEffect(() => {
    const warn = event => { if (pending) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending]);
  const statusText = { idle: 'Изменения будут сохраняться автоматически.', waiting: 'Ожидание автосохранения…', saving: 'Сохранение на сервер…', saved: 'Все изменения сохранены на сервере.', invalid: 'Черновик сохранён. Исправьте ошибки для отправки на сервер.', error: 'Не удалось сохранить на сервере. Черновик сохранён, повторите отправку.' };
  return <><Link className="back-link" to="/students">← К списку</Link><section className="card narrow"><span className="eyebrow">{id ? 'РЕДАКТИРОВАНИЕ' : 'НОВАЯ ЗАПИСЬ'}</span><h1>{id ? 'Редактировать студента' : 'Добавить студента'}</h1><p className="muted">{id ? 'Корректные изменения сохраняются на сервере через 0,9 секунды после ввода.' : 'Черновик сохраняется в этом браузере. Для создания записи нажмите «Добавить».'}</p>
    {draftOffered && <div className="alert undo"><span>Найден черновик от {new Date(draft.savedAt).toLocaleString('ru-RU')}. Восстановить его?</span><div className="row-actions"><button onClick={restoreDraft}>Восстановить черновик</button><button className="ghost" onClick={discardDraft}>Удалить черновик</button></div></div>}
    {storageError && <ErrorMessage error="Браузер запретил локальное сохранение черновика. Не закрывайте форму до сохранения на сервере."/>}
    {blocker.state === 'blocked' && <div className="alert undo" role="alert"><span>Есть изменения, которые ещё не сохранены на сервере. {storageError ? 'Локальное сохранение недоступно.' : 'При уходе черновик останется в браузере.'}</span><button onClick={() => blocker.reset()}>Остаться</button><button disabled={busy || storageError} onClick={() => blocker.proceed()}>Уйти с черновиком</button></div>}
    <ErrorMessage error={error || autosave.error}/>
    <form onSubmit={submit} noValidate aria-busy={busy || autosave.pending > 0}>
      <fieldset disabled={busy || draftOffered}><div className="form-grid">
        {fields.map(([name, label, type]) => <Field key={name} name={name} label={`${label} *`} error={errors[name]}><input id={name} name={name} type={type} value={value[name]} required min={type === 'number' ? 1 : type === 'date' ? '1970-08-25' : undefined} max={type === 'number' ? 2147483647 : type === 'date' ? today() : undefined} step={type === 'number' ? 1 : undefined} maxLength={name === 'fullName' ? 200 : name === 'group' ? 100 : name === 'isuId' ? 6 : undefined} inputMode={name === 'isuId' ? 'numeric' : undefined} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} onChange={event => update({ ...value, [name]: event.target.value })}/></Field>)}
        <div className="field span-all"><label className="checkbox" htmlFor="isForeigner"><input id="isForeigner" type="checkbox" checked={value.isForeigner} onChange={event => update({ ...value, isForeigner: event.target.checked })}/>Иностранный студент</label></div>
        <div className="span-all"><Field name="notes" label="Заметки" error={errors.notes}><textarea id="notes" rows="4" maxLength={5000} value={value.notes} aria-invalid={!!errors.notes} onChange={event => update({ ...value, notes: event.target.value })}/><small className="muted">{value.notes.length} / 5000</small></Field></div>
      </div><div className="save-status" role="status">{id ? statusText[autosave.status] : localSaved ? '✓ Черновик сохранён в браузере.' : 'Обязательные поля отмечены *.'}</div>
      <div className="form-actions"><button className="primary" disabled={busy || autosave.pending > 0}>{busy || autosave.pending > 0 ? 'Сохранение…' : id ? 'Сохранить сейчас' : 'Добавить'}</button><Link className="button" to="/students">К списку</Link></div>
      </fieldset>
    </form>
  </section></>;
}
