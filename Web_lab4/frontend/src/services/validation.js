export const emptyStudent = {
  fullName: '',
  group: '',
  isuId: '',
  dormitory: '',
  room: '',
  moveInDate: '',
  isForeigner: false,
  notes: '',
};
export const fields = [
  ['fullName', 'ФИО', 'text'],
  ['group', 'Группа', 'text'],
  ['isuId', 'ИСУ ID', 'text'],
  ['dormitory', 'Общежитие', 'number'],
  ['room', 'Комната', 'number'],
  ['moveInDate', 'Дата заселения', 'date'],
];
export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function studentErrors(value) {
  const errors = {};
  if (
    !value.fullName.trim() ||
    value.fullName.trim().length > 200 ||
    !/^[a-zA-Zа-яА-ЯёЁ\s\-']+$/.test(value.fullName)
  )
    errors.fullName = 'От 1 до 200 символов: буквы, пробел, дефис, апостроф.';
  if (!value.group.trim() || value.group.trim().length > 100)
    errors.group = 'Укажите группу, до 100 символов.';
  if (!/^\d{6}$/.test(value.isuId))
    errors.isuId = 'ИСУ ID должен содержать ровно 6 цифр.';
  for (const field of ['dormitory', 'room']) {
    const number = Number(value[field]);
    if (!Number.isInteger(number) || number < 1 || number > 2147483647)
      errors[field] = 'Целое число от 1 до 2147483647.';
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value.moveInDate) ||
    Number.isNaN(Date.parse(value.moveInDate)) ||
    (!Number.isNaN(Date.parse(value.moveInDate)) &&
      new Date(value.moveInDate).toISOString().slice(0, 10) !== value.moveInDate) ||
    value.moveInDate < '1970-08-25' ||
    value.moveInDate > today()
  )
    errors.moveInDate = 'Дата от 25.08.1970 до сегодняшнего дня.';
  if (value.notes.length > 5000) errors.notes = 'Максимум 5000 символов.';
  return errors;
}
export function studentPayload(value) {
  return {
    ...Object.fromEntries(Object.keys(emptyStudent).map(key => [key, value[key]])),
    fullName: value.fullName.trim(),
    group: value.group.trim(),
    notes: value.notes.trim(),
    dormitory: Number(value.dormitory),
    room: Number(value.room),
  };
}
export function authErrors(value, register) {
  const errors = {};
  if (
    !value.username.trim() ||
    value.username.length > 50 ||
    (register && !/^[a-zA-Z0-9_]{3,50}$/.test(value.username))
  )
    errors.username = register
      ? '3–50 символов: латиница, цифры, _.'
      : 'Укажите имя пользователя (до 50 символов).';
  if (
    !value.password ||
    value.password.length > 72 ||
    new TextEncoder().encode(value.password).length > 72 ||
    (register && value.password.length < 8)
  )
    errors.password = register
      ? 'От 8 символов, максимум 72 байта UTF-8.'
      : 'Укажите пароль, максимум 72 байта UTF-8.';
  if (
    register &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.email.length > 254)
  )
    errors.email = 'Введите корректный email (до 254 символов).';
  if (register && value.confirm !== value.password)
    errors.confirm = 'Пароли не совпадают.';
  return errors;
}
