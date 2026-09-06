export function validateStudent(student) {
    const errors = {}; // export делает функцию доступной для импорта в других модулях

    // ФИО – не пустое
    if (!student.fullName || student.fullName.trim() === '') {
        errors.fullName = 'ФИО обязательно для заполнения';     // trim() удаляет пробелы в начале и конце
    }
    // группа – не пустая
    if (!student.group || student.group.trim() === '') {
        errors.group = 'Группа обязательна для заполнения';
    }
    // ИСУ ID – 6-ти значное число
   if (student.isuId === undefined || student.isuId === null || student.isuId === '') {
    errors.isuId = 'ИСУ ID обязателен';
    } else {
    const str = String(student.isuId);
    if (!/^\d{6}$/.test(str)) {
        errors.isuId = 'ИСУ ID должен содержать ровно 6 цифр';
    }

    // общежитие – число >= 1
    if (student.dormitory === undefined || isNaN(student.dormitory) || student.dormitory < 1) {
        errors.dormitory = 'Номер общежития должен быть положительным числом';
    }
    // комната – число >= 1
    if (student.room === undefined || isNaN(student.room) || student.room < 1) {
        errors.room = 'Комната должна быть положительным числом';
    }
    // дата заселения – не пустая
    if (!student.moveInDate) {
        errors.moveInDate = 'Срок заселения обязателен';
    }
        // проверка диапазона даты
    const minDate = '1970-08-25';
    const maxDate = '2026-09-08';
    if (student.moveInDate) {
        if (student.moveInDate < minDate) {
            errors.moveInDate = 'Дата заселения не может быть раньше 25.08.1970';
        } else if (student.moveInDate > maxDate) {
            errors.moveInDate = 'Дата заселения не может быть позже 08.09.2026';
        }
    }

}

    return errors;
}