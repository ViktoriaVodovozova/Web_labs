'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { updateStudentAction } from '../actions';

export default function EditStudentForm({ student }) {
  const [state, action, pending] = useActionState(updateStudentAction.bind(null, student.id), { error: null });
  return (
    <section className="card narrow"><h2>Редактировать студента</h2>
      {state?.error && <div className="alert error" role="alert">{state.error} <Link href="/students">К списку студентов</Link></div>}
      <form action={action} className="form-grid">
        <input type="hidden" name="version" value={student.version} />
        <div className="field"><label>ФИО *</label><input type="text" name="fullName" required defaultValue={student.fullName} maxLength={200} /></div>
        <div className="field"><label>Группа *</label><input type="text" name="group" required defaultValue={student.group} maxLength={100} /></div>
        <div className="field"><label>ИСУ ID *</label><input type="text" name="isuId" required defaultValue={student.isuId} pattern="[0-9]{6}" title="Ровно 6 цифр" /></div>
        <div className="field"><label>Общежитие *</label><input type="number" name="dormitory" required defaultValue={student.dormitory} min="1" /></div>
        <div className="field"><label>Комната *</label><input type="number" name="room" required defaultValue={student.room} min="1" /></div>
        <div className="field"><label>Дата заселения *</label><input type="date" name="moveInDate" required defaultValue={student.moveInDate} /></div>
        <div className="field span-all"><label className="checkbox"><input type="checkbox" name="isForeigner" defaultChecked={student.isForeigner} /> Иностранный студент</label></div>
        <div className="field span-all"><label>Заметки</label><textarea name="notes" rows="4" defaultValue={student.notes} maxLength={5000}></textarea></div>
        <div className="form-actions span-all"><button type="submit" className="primary" disabled={pending}>{pending ? 'Сохранение…' : 'Сохранить'}</button><Link href={`/students/${student.id}`} className="button">Отмена</Link></div>
      </form>
    </section>
  );
}
