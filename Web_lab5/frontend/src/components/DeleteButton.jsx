import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ErrorMessage } from './Common';

export default function DeleteButton({ student, onDeleted }) {
  const { deleteStudent, mutationBusy } = useApp();
  const [error, setError] = useState(null);
  async function remove() {
    if (
      !window.confirm(
        `Удалить студента «${student.fullName}»? Удаление можно будет отменить.`
      )
    )
      return;
    setError(null);
    try {
      if (await deleteStudent(student)) onDeleted?.();
    } catch (error) {
      setError(error);
    }
  }
  return (
    <>
      <button
        className="danger ghost"
        disabled={mutationBusy}
        onClick={remove}
        aria-label={`Удалить: ${student.fullName}`}
      >
        Удалить
      </button>
      <ErrorMessage error={error} />
    </>
  );
}
