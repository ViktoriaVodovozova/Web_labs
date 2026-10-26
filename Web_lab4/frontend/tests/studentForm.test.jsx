import { transferableAbortController } from 'node:util';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppProvider } from '../src/context/AppContext';
import { setSession } from '../src/services/session';
import { studentsApi } from '../src/services/studentsApi';
import StudentForm from '../src/pages/StudentForm';

vi.mock('../src/services/studentsApi', () => ({
  studentsApi: { get: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
const student = {
  id: '1',
  fullName: 'Иван Петров',
  group: 'P3121',
  isuId: '123456',
  dormitory: 2,
  room: 317,
  moveInDate: '2024-09-01',
  isForeigner: false,
  notes: '',
};
// React Router's Node Request requires a Node-compatible AbortSignal in jsdom.
beforeEach(() => {
  vi.stubGlobal(
    'AbortController',
    class {
      constructor() {
        return transferableAbortController();
      }
    }
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  sessionStorage.clear();
  setSession(null);
  vi.resetAllMocks();
});

function mount(path) {
  setSession({
    username: 'admin',
    role: 'ADMIN',
    accessToken: 'a',
    refreshToken: 'r',
  });
  const router = createMemoryRouter(
    [
      {
        path: '/students/new',
        element: (
          <AppProvider>
            <StudentForm />
          </AppProvider>
        ),
      },
      {
        path: '/students/:id/edit',
        element: (
          <AppProvider>
            <StudentForm />
          </AppProvider>
        ),
      },
      { path: '/students/:id', element: <h1>Карточка студента</h1> },
    ],
    { initialEntries: [path] }
  );
  return render(<RouterProvider router={router} />);
}
function fill() {
  for (const [label, value] of [
    ['ФИО *', student.fullName],
    ['Группа *', student.group],
    ['ИСУ ID *', student.isuId],
    ['Общежитие *', '2'],
    ['Комната *', '317'],
    ['Дата заселения *', student.moveInDate],
  ]) {
    fireEvent.change(screen.getByLabelText(label, { exact: true }), {
      target: { value },
    });
  }
}

describe('Сохранение студента по кнопке', () => {
  it('создаёт студента по нажатию, блокирует повторный запрос и открывает карточку', async () => {
    let resolve;
    studentsApi.create.mockImplementation(
      () =>
        new Promise(done => {
          resolve = done;
        })
    );
    mount('/students/new');
    fill();
    expect(studentsApi.create).not.toHaveBeenCalled();
    const button = screen.getByRole('button', { name: 'Добавить', exact: true });
    fireEvent.click(button);
    expect(button.disabled).toBe(true);
    fireEvent.submit(button.closest('form'));
    expect(studentsApi.create).toHaveBeenCalledTimes(1);
    expect(studentsApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: student.fullName,
        dormitory: 2,
        room: 317,
      })
    );
    await act(async () => resolve(student));
    expect(screen.getByRole('heading', { name: 'Карточка студента' })).toBeTruthy();
  });
  it('не сохраняет редактирование автоматически и отправляет PUT только по кнопке', async () => {
    vi.useFakeTimers();
    studentsApi.get.mockResolvedValue(student);
    studentsApi.update.mockResolvedValue({ ...student, group: 'P3122' });
    mount('/students/1/edit');
    await act(async () => {});
    fireEvent.change(screen.getByLabelText('Группа *'), {
      target: { value: 'P3122' },
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(studentsApi.update).not.toHaveBeenCalled();
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Сохранить', exact: true }))
    );
    expect(studentsApi.update).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ group: 'P3122' })
    );
    expect(screen.getByRole('heading', { name: 'Карточка студента' })).toBeTruthy();
  });
  it('при ошибке сервера сохраняет введённые данные и разрешает повторную попытку', async () => {
    studentsApi.create.mockRejectedValue(new Error('Сервер недоступен.'));
    mount('/students/new');
    fill();
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Добавить', exact: true }))
    );
    expect(screen.getByText('Сервер недоступен.')).toBeTruthy();
    expect(screen.getByLabelText('ФИО *').value).toBe(student.fullName);
    expect(
      screen.getByRole('button', { name: 'Добавить', exact: true }).disabled
    ).toBe(false);
  });
});
