import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStudent } from '../hooks/useStudent';
import { useApp } from '../context/AppContext';
import { ErrorMessage, Loading } from '../components/Common';
import DeleteButton from '../components/DeleteButton';
import { fields } from '../services/validation';
export default function StudentDetail() {
  const { id } = useParams();
  const { data, loading, error, retry } = useStudent(id);
  const { isAdmin } = useApp();
  const navigate = useNavigate();
  return (
    <>
      <Link className="back-link" to="/students">
        ← К списку
      </Link>
      <section className="card narrow">
        <h1>{data?.fullName || 'Студент'}</h1>
        <ErrorMessage error={error} retry={retry} />
        {loading && <Loading />}
        {data && (
          <>
            <dl className="details">
              {fields.map(([name, label]) => (
                <div className="detail-pair" key={name}>
                  <dt>{label}</dt>
                  <dd>
                    {name === 'moveInDate'
                      ? data[name].split('-').reverse().join('.')
                      : data[name]}
                  </dd>
                </div>
              ))}
              <dt>Иностранец</dt>
              <dd>{data.isForeigner ? 'Да' : 'Нет'}</dd>
              <dt>Заметки</dt>
              <dd className="preserve">{data.notes || '—'}</dd>
              <dt>ID записи</dt>
              <dd className="mono">{data.id}</dd>
            </dl>
            {isAdmin && (
              <div className="form-actions">
                <Link className="button primary" to={`/students/${id}/edit`}>
                  Редактировать
                </Link>
                <DeleteButton
                  student={data}
                  onDeleted={() => navigate('/students')}
                />
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
