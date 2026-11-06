import { createStudentAction } from '../actions';
import Link from 'next/link';

export default function NewStudentPage() {
  return (
    <section className="card narrow">
      <h2>Добавить студента</h2>
      <form action={createStudentAction} className="form-grid">
        <div className="field"><label>ФИО *</label><input type="text" name="fullName" required maxLength={200} /></div>
        <div className="field"><label>Группа *</label><input type="text" name="group" required maxLength={100} /></div>
        <div className="field"><label>ИСУ ID *</label><input type="text" name="isuId" required pattern="[0-9]{6}" title="Ровно 6 цифр" /></div>
        <div className="field"><label>Общежитие *</label><input type="number" name="dormitory" required min="1" /></div>
        <div className="field"><label>Комната *</label><input type="number" name="room" required min="1" /></div>
        <div className="field"><label>Дата заселения *</label><input type="date" name="moveInDate" required /></div>
        <div className="field span-all"><label className="checkbox"><input type="checkbox" name="isForeigner" /> Иностранный студент</label></div>
        <div className="field span-all"><label>Заметки</label><textarea name="notes" rows="4" maxLength={5000}></textarea></div>
        <div className="form-actions span-all"><button type="submit" className="primary">Добавить</button><Link href="/students" className="button">Отмена</Link></div>
      </form>
    </section>
  );
}