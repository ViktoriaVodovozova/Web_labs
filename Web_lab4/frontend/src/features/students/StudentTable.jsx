import { Link } from 'react-router-dom';
import DeleteButton from '../../components/DeleteButton';

export default function StudentTable({ students, isAdmin }) {
  return (
    <div className="table-scroll" role="region"
      aria-label="Таблица студентов, доступна горизонтальная прокрутка" tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th>ФИО / ИСУ ID</th><th>Группа</th><th>Общежитие / комната</th>
            <th>Заселение</th><th>Иностранец</th><th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td>
                <Link className="student-name" to={`/students/${student.id}`}>{student.fullName}</Link>
                <small className="mono muted">{student.isuId}</small>
              </td>
              <td><span className="badge">{student.group}</span></td>
              <td>№{student.dormitory} / {student.room}</td>
              <td>{student.moveInDate.split('-').reverse().join('.')}</td>
              <td>{student.isForeigner ? 'Да' : 'Нет'}</td>
              <td>
                <div className="row-actions">
                  <Link to={`/students/${student.id}`}>Подробнее</Link>
                  {isAdmin && <>
                    <Link to={`/students/${student.id}/edit`}>Изменить</Link>
                    <DeleteButton student={student}/>
                  </>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
