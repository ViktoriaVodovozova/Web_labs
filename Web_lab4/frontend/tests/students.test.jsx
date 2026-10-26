import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import StudentFilters from '../src/features/students/StudentFilters';
import StudentTable from '../src/features/students/StudentTable';
import StudentPagination from '../src/features/students/StudentPagination';
import { filterFields } from '../src/features/students/listConfig';

afterEach(cleanup);

describe('Компоненты списка студентов', () => {
  it('передаёт выбранный фильтр родительской странице', async () => {
    // Arrange
    const onChange = vi.fn();
    const query = {
      ...Object.fromEntries(filterFields.map(([name]) => [name, ''])),
      search: '', isForeigner: '', sortBy: 'fullName', direction: 'asc',
    };
    render(<StudentFilters query={query} onChange={onChange} onReset={vi.fn()}/>);
    const user = userEvent.setup();

    // Act: пользователь открывает фильтры и выбирает значение по подписи поля.
    await user.click(screen.getByText('Другие фильтры'));
    await user.selectOptions(screen.getByLabelText('Иностранец'), 'true');

    // Assert
    expect(onChange).toHaveBeenCalledWith('isForeigner', 'true');
  });

  it('на первой странице запрещает переход назад и позволяет перейти вперёд', async () => {
    // Arrange
    const onPageChange = vi.fn();
    render(<StudentPagination page={0} size={10} pages={2} loading={false}
      onPageChange={onPageChange} onSizeChange={vi.fn()}/>);
    const user = userEvent.setup();

    // Act
    await user.click(screen.getByRole('button', { name: 'Вперёд →' }));

    // Assert
    expect(screen.getByRole('button', { name: '← Назад' }).disabled).toBe(true);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('показывает данные студента без кнопок изменения для USER', () => {
    // Arrange
    const student = {
      id: 'student-1', fullName: 'Иван Петров', group: 'P3121', isuId: '012345',
      dormitory: 2, room: 317, moveInDate: '2024-09-01', isForeigner: false,
    };

    // Act
    render(<MemoryRouter><StudentTable students={[student]} isAdmin={false}/></MemoryRouter>);

    // Assert
    expect(screen.getByRole('link', { name: 'Иван Петров' }).getAttribute('href')).toBe('/students/student-1');
    expect(screen.getByText('012345')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Изменить' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Удалить/ })).toBeNull();
  });
});
