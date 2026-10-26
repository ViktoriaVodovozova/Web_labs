import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppProvider, useApp } from '../src/context/AppContext';
import { setSession } from '../src/services/session';
import { studentsApi } from '../src/services/studentsApi';
import StudentForm from '../src/pages/StudentForm';
import AuthPage from '../src/pages/AuthPage';

vi.mock('../src/services/studentsApi', () => ({
  studentsApi: {
    delete: vi.fn().mockResolvedValue(null),
    restore: vi.fn().mockResolvedValue({}),
  },
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  sessionStorage.clear();
  localStorage.clear();
  setSession(null);
  vi.clearAllMocks();
});

function mount(element) {
  const router = createMemoryRouter(
    [{ path: '/', element: <AppProvider>{element}</AppProvider> }],
    { initialEntries: ['/'] }
  );
  return render(<RouterProvider router={router} />);
}
function UndoControls() {
  const { deleteStudent, undo, undoSeconds, undoDelete } = useApp();
  return (
    <>
      <button onClick={() => deleteStudent({ id: '1', fullName: 'Иван' })}>
        Удалить
      </button>
      {!!undo.length && <button onClick={undoDelete}>Отменить {undoSeconds}</button>}
    </>
  );
}
function admin() {
  setSession({
    username: 'admin',
    role: 'ADMIN',
    accessToken: 'a',
    refreshToken: 'r',
  });
}

describe('Таймер и сообщения формы', () => {
  it('убирает отмену через 10 секунд и не возвращает её после обновления', async () => {
    vi.useFakeTimers();
    admin();
    const view = mount(<UndoControls />);
    await act(async () => {
      fireEvent.click(screen.getByText('Удалить'));
    });
    expect(screen.getByText('Отменить 10')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(9000);
    });
    expect(screen.getByText('Отменить 1')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText(/Отменить/)).toBeNull();
    view.unmount();
    mount(<UndoControls />);
    expect(screen.queryByText(/Отменить/)).toBeNull();
  });
  it('восстанавливает запись до окончания таймера', async () => {
    vi.useFakeTimers();
    admin();
    mount(<UndoControls />);
    await act(async () => {
      fireEvent.click(screen.getByText('Удалить'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Отменить 10'));
    });
    expect(studentsApi.restore).toHaveBeenCalledWith('1');
    expect(screen.queryByText(/Отменить/)).toBeNull();
  });
  it('не перезапускает оставшееся время после обновления страницы', async () => {
    vi.useFakeTimers();
    admin();
    const view = mount(<UndoControls />);
    await act(async () => {
      fireEvent.click(screen.getByText('Удалить'));
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    view.unmount();
    mount(<UndoControls />);
    expect(screen.getByText('Отменить 4')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText(/Отменить/)).toBeNull();
  });
  it('показывает ошибку только посещённого поля студента и убирает её после исправления', () => {
    admin();
    mount(<StudentForm />);
    const isu = screen.getByLabelText('ИСУ ID *');
    fireEvent.change(isu, { target: { value: '12' } });
    expect(screen.queryByText('ИСУ ID должен содержать ровно 6 цифр.')).toBeNull();
    expect(screen.queryByText('Укажите группу, до 100 символов.')).toBeNull();
    fireEvent.blur(isu);
    expect(screen.getByText('ИСУ ID должен содержать ровно 6 цифр.')).toBeTruthy();
    expect(screen.queryByText('Укажите группу, до 100 символов.')).toBeNull();
    fireEvent.change(isu, { target: { value: '123456' } });
    expect(screen.queryByText('ИСУ ID должен содержать ровно 6 цифр.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить', exact: true }));
    expect(screen.getByText('Укажите группу, до 100 символов.')).toBeTruthy();
  });
  it('показывает ошибку регистрации после выхода из поля', () => {
    setSession(null);
    mount(<AuthPage register />);
    const username = screen.getByLabelText('Имя пользователя');
    fireEvent.change(username, { target: { value: 'я' } });
    expect(screen.queryByText('3–50 символов: латиница, цифры, _.')).toBeNull();
    fireEvent.blur(username);
    expect(screen.getByText('3–50 символов: латиница, цифры, _.')).toBeTruthy();
    fireEvent.change(username, { target: { value: 'lisa' } });
    expect(screen.queryByText('3–50 символов: латиница, цифры, _.')).toBeNull();
    expect(
      screen.queryByText('Введите корректный email (до 254 символов).')
    ).toBeNull();
  });
});
