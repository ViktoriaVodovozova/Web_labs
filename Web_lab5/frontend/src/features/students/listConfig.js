import { fields } from '../../services/validation';

export const filterFields = [
  ['id', 'ID записи', 'text'],
  ...fields,
  ['notes', 'Заметки', 'text'],
];
export const sortFields = [
  ...filterFields.map(([name, label]) => [name, label]),
  ['isForeigner', 'Иностранец'],
];
export const pageSizes = [5, 10, 20, 50, 100];
