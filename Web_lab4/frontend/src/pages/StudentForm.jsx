import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useStudent } from '../hooks/useStudent';
import { studentsApi } from '../services/studentsApi';
import {
  emptyStudent,
  fields,
  studentErrors,
  studentPayload,
  today,
} from '../services/validation';
import { ErrorMessage, Loading, Field } from '../components/Common';

export default function StudentFormPage() {
  const { id } = useParams();
  const state = useStudent(id);

  if (state.loading) return <Loading />;
  if (state.error) return <ErrorMessage error={state.error} retry={state.retry} />;

  return (
    <StudentForm key={id || 'new'} id={id} initial={state.data || emptyStudent} />
  );
}

function StudentForm({ id, initial }) {
  const { changed } = useApp();
  const [value, setValue] = useState(() => ({ ...emptyStudent, ...initial }));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const navigate = useNavigate();

  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(([name]) => submitted || touched[name])
  );

  function update(next) {
    setValue(next);
    setErrors(studentErrors(next));
    setError(null);
  }

  function blur(event) {
    const name = event.target.id;
    if (name in emptyStudent) {
      setTouched(old => ({ ...old, [name]: true }));
      const message = studentErrors(value)[name];
      setErrors(old => ({ ...old, [name]: message }));
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;

    setSubmitted(true);
    const problems = studentErrors(value);
    setErrors(problems);
    setError(null);

    if (Object.keys(problems).length) {
      document.getElementById(Object.keys(problems)[0])?.focus();
      return;
    }

    lock.current = true;
    setBusy(true);

    try {
      const payload = studentPayload(value);
      const student = id
        ? await studentsApi.update(id, payload)
        : await studentsApi.create(payload);

      changed();
      navigate(`/students/${student.id}`);
    } catch (error) {
      setError(error);
      setErrors(error.detail || {});
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <Link className="back-link" to="/students">
        ← К списку
      </Link>
      <section className="card narrow">
        <h1>{id ? 'Редактировать студента' : 'Добавить студента'}</h1>
        <ErrorMessage error={error} />
        <form onSubmit={submit} onBlur={blur} noValidate aria-busy={busy}>
          <fieldset disabled={busy}>
            <div className="form-grid">
              {fields.map(([name, label, type]) => (
                <Field
                  key={name}
                  name={name}
                  label={`${label} *`}
                  error={visibleErrors[name]}
                >
                  <input
                    id={name}
                    name={name}
                    type={type}
                    value={value[name]}
                    required
                    min={
                      type === 'number'
                        ? 1
                        : type === 'date'
                          ? '1970-08-25'
                          : undefined
                    }
                    max={
                      type === 'number'
                        ? 2147483647
                        : type === 'date'
                          ? today()
                          : undefined
                    }
                    step={type === 'number' ? 1 : undefined}
                    maxLength={
                      name === 'fullName'
                        ? 200
                        : name === 'group'
                          ? 100
                          : name === 'isuId'
                            ? 6
                            : undefined
                    }
                    inputMode={name === 'isuId' ? 'numeric' : undefined}
                    aria-invalid={!!visibleErrors[name]}
                    aria-describedby={
                      visibleErrors[name] ? `${name}-error` : undefined
                    }
                    onChange={event =>
                      update({ ...value, [name]: event.target.value })
                    }
                  />
                </Field>
              ))}
              <div className="field span-all">
                <label className="checkbox" htmlFor="isForeigner">
                  <input
                    id="isForeigner"
                    type="checkbox"
                    checked={value.isForeigner}
                    onChange={event =>
                      update({ ...value, isForeigner: event.target.checked })
                    }
                  />
                  Иностранный студент
                </label>
              </div>
              <div className="span-all">
                <Field name="notes" label="Заметки" error={visibleErrors.notes}>
                  <textarea
                    id="notes"
                    rows="4"
                    maxLength={5000}
                    value={value.notes}
                    aria-invalid={!!visibleErrors.notes}
                    onChange={event =>
                      update({ ...value, notes: event.target.value })
                    }
                  />
                  <small className="muted">{value.notes.length} / 5000</small>
                </Field>
              </div>
            </div>
            <div className="form-actions">
              <button className="primary" disabled={busy}>
                {busy ? 'Сохранение…' : id ? 'Сохранить' : 'Добавить'}
              </button>
              <Link className="button" to="/students">
                К списку
              </Link>
            </div>
          </fieldset>
        </form>
      </section>
    </>
  );
}
