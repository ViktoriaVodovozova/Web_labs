import { describe, it, expect } from 'vitest';
import { studentErrors } from '../src/services/validation';

describe('Проверка формы студента', () => {
  it('отклоняет ИСУ ID, если в нём не шесть цифр', () => {
    // Arrange: остальные поля заполнены корректно.
    const student = {
      fullName: 'Иван Петров', group: 'P3121', isuId: '12345',
      dormitory: 2, room: 317, moveInDate: '2024-09-01',
      isForeigner: false, notes: '',
    };

    // Act
    const errors = studentErrors(student);

    // Assert
    expect(errors).toEqual({ isuId: 'ИСУ ID должен содержать ровно 6 цифр.' });
  });
});
