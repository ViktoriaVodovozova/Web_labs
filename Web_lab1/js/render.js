// экранирование спецсимволов
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// отрисовка таблицы
export function renderStudentTable(students, container) {
    if (!container) return;
    if (students.length === 0) {
        container.innerHTML = '<tr><td colspan="8">Студентов пока нет</td></tr>';
        return;
    }

    let html = '';
    students.forEach(student => {
        const foreign = student.isForeigner ? 'Да' : 'Нет';
        html += `
            <tr>
                <td data-label="ФИО">${escapeHtml(student.fullName)}</td>
                <td data-label="Группа">${escapeHtml(student.group)}</td>
                <td data-label="ИСУ ID">${student.isuId}</td>
                <td data-label="Общежитие">${student.dormitory}</td>
                <td data-label="Комната">${student.room}</td>
                <td data-label="Срок заселения">${student.moveInDate}</td>
                <td data-label="Иностранец">${foreign}</td>
                <td data-label="Действия">
                    <a href="profile.html?id=${student.id}" class="details"> Подробнее</a>
                    <a href="form.html?id=${student.id}" class="edit">️ Редактировать</a>
                    <button class="delete" data-id="${student.id}"> Удалить</button>
                </td>
            </tr>
        `;
    });
    container.innerHTML = html;
}

// заполнение формы данными студента (или сброс)
export function renderForm(student) {
    const form = document.getElementById('student-form');
    if (!form) return;
    form.reset();
    document.getElementById('edit-id').value = '';

    if (student) {
        document.getElementById('edit-id').value = student.id || '';
        document.getElementById('fullName').value = student.fullName || '';
        document.getElementById('group').value = student.group || '';
        document.getElementById('isuId').value = student.isuId || '';
        document.getElementById('dormitory').value = student.dormitory || '';
        document.getElementById('room').value = student.room || '';
        document.getElementById('moveInDate').value = student.moveInDate || '';
        document.getElementById('isForeigner').checked = student.isForeigner || false;
        document.getElementById('notes').value = student.notes || '';
    } else {
        document.getElementById('isForeigner').checked = false;
    }
}

// Отрисовка досье
export function renderProfile(student, container) {
    if (!student) {
        container.innerHTML = '<p>Студент не найден</p>';
        return;
    }
    const foreign = student.isForeigner ? 'Да' : 'Нет';
    container.innerHTML = `
        <div class="profile-item"><strong>ФИО:</strong> ${escapeHtml(student.fullName)}</div>
        <div class="profile-item"><strong>Группа:</strong> ${escapeHtml(student.group)}</div>
        <div class="profile-item"><strong>ИСУ ID:</strong> ${student.isuId}</div>
        <div class="profile-item"><strong>Номер общежития:</strong> ${student.dormitory}</div>
        <div class="profile-item"><strong>Комната:</strong> ${student.room}</div>
        <div class="profile-item"><strong>Срок заселения:</strong> ${student.moveInDate}</div>
        <div class="profile-item"><strong>Иностранец:</strong> ${foreign}</div>
        <div class="profile-item"><strong>Заметки:</strong> ${escapeHtml(student.notes) || '—'}</div>
    `;
}