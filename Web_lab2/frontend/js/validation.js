export function validateStudent(student) {
    const errors = {};

    if (!student.fullName || student.fullName.trim() === '') {
        errors.fullName = 'ФИО обязательно для заполнения';
    } else {
        const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/;
        if (!nameRegex.test(student.fullName)) {
            errors.fullName = 'ФИО должно содержать только буквы, пробелы, дефис или апостроф';
        }
    }

    if (!student.group || student.group.trim() === '') {
        errors.group = 'Группа обязательна для заполнения';
    }

    if (!student.isuId) {
        errors.isuId = 'ИСУ ID обязателен';
    } else if (!/^\d{6}$/.test(String(student.isuId))) {
        errors.isuId = 'ИСУ ID должен содержать ровно 6 цифр';
    }

    if (student.dormitory === undefined || isNaN(student.dormitory) || student.dormitory < 1) {
        errors.dormitory = 'Номер общежития должен быть положительным числом';
    }

    if (student.room === undefined || isNaN(student.room) || student.room < 1) {
        errors.room = 'Комната должна быть положительным числом';
    }

    if (!student.moveInDate) {
        errors.moveInDate = 'Срок заселения обязателен';
    } else {
        const minDate = '1970-08-25';
        const today = new Date();
        const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (student.moveInDate < minDate) {
            errors.moveInDate = 'Дата не может быть раньше 25.08.1970';
        } else if (student.moveInDate > maxDate) {
            errors.moveInDate = 'Дата не может быть позже сегодняшнего дня';
        }
    }

    return errors;
}