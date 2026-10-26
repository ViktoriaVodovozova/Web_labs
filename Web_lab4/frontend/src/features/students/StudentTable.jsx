import { Link } from 'react-router-dom';
import DeleteButton from '../../components/DeleteButton';

export default function StudentTable({ students, isAdmin }) {
  return (
    <div className="table-scroll" role="region"
      aria-label="Таблица студентов, доступна горизонтальная прокрутка" tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th>ФИО</th><th>Группа</th><th>ИСУ ID</th><th>Общежитие</th>
            <th>Комната</th><th>Срок заселения</th><th>Иностранец</th><th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td data-label="ФИО"><Link to={`/students/${student.id}`}>{student.fullName}</Link></td>
              <td data-label="Группа">{student.group}</td>
              <td data-label="ИСУ ID">{student.isuId}</td>
              <td data-label="Общежитие">{student.dormitory}</td>
              <td data-label="Комната">{student.room}</td>
              <td data-label="Срок заселения">{student.moveInDate.split('-').reverse().join('.')}</td>
              <td data-label="Иностранец">{student.isForeigner ? 'Да' : 'Нет'}</td>
              <td>
                <div className="row-actions">
                  <Link className="button details-button" to={`/students/${student.id}`}>Подробнее</Link>
                  {isAdmin && <>
                    <Link className="button edit" to={`/students/${student.id}/edit`}>Изменить</Link>
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
