import { getStudents, getStudentById, addStudent, updateStudent, deleteStudent } from './storage.js';
import { validateStudent } from './validation.js';
import { renderStudentTable, renderForm, renderProfile } from './render.js';

const listPage = document.getElementById('list-page');
const formPage = document.getElementById('form-page');
const profilePage = document.getElementById('profile-page');

let students = [];
let editingId = null;

function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

async function init() {
    if (listPage) {
        students = await getStudents();
        renderStudentTable(students, document.getElementById('student-table-body'));
        document.getElementById('student-table-body').addEventListener('click', handleTableClick);

        const filterBtn = document.getElementById('filter-btn');
        if (filterBtn) filterBtn.addEventListener('click', applyFilters);
    }

    if (formPage) {
        const id = getParam('id');
        let student = null;
        if (id) {
            student = await getStudentById(id);
            editingId = id;
            document.getElementById('form-title').textContent = '️ Редактирование студента';
        } else {
            document.getElementById('form-title').textContent = ' Добавление студента';
            editingId = null;
        }
        renderForm(student);
    }

    if (profilePage) {
        const id = getParam('id');
        if (id) {
            const student = await getStudentById(id);
            renderProfile(student, document.getElementById('profile-content'));
        } else {
            document.getElementById('profile-content').innerHTML = '<p>Студент не найден</p>';
        }
    }
}

async function applyFilters() {
    const group = document.getElementById('filter-group').value.trim();
    const dormitory = document.getElementById('filter-dormitory').value.trim();

    const filters = {};
    if (group) filters.group = group;
    if (dormitory) filters.dormitory = dormitory;

    students = await getStudents(filters);
    renderStudentTable(students, document.getElementById('student-table-body'));
}

async function handleTableClick(e) {
    const target = e.target;

    // Если это ссылка на профиль или форму — не мешаем браузеру перейти
    if (target.tagName === 'A') {
        return; // пусть браузер сам обработает переход
    }

    // Дальше только обработка удаления
    if (!target.classList.contains('delete')) return;
    const id = target.dataset.id;
    if (!id) return;
    const student = students.find(s => s.id === id);
    if (!student) return;
    if (confirm(`Удалить студента "${student.fullName}"?`)) {
        await deleteStudent(id);
        students = await getStudents();
        renderStudentTable(students, document.getElementById('student-table-body'));
    }
}

window.handleFormSubmit = async function(e) {
    e.preventDefault();
    const form = document.getElementById('student-form');
    const formData = new FormData(form);
    const student = {
        fullName: formData.get('fullName').trim(),
        group: formData.get('group').trim(),
        isuId: formData.get('isuId').trim(),
        dormitory: Number(formData.get('dormitory')),
        room: Number(formData.get('room')),
        moveInDate: formData.get('moveInDate'),
        isForeigner: formData.get('isForeigner') === 'on',
        notes: formData.get('notes').trim()
    };

    const clientErrors = validateStudent(student);
    const errorsContainer = document.getElementById('form-errors');
    if (Object.keys(clientErrors).length > 0) {
        errorsContainer.innerHTML = Object.values(clientErrors).join('<br>');
        return false;
    }
    errorsContainer.textContent = '';

    try {
        if (editingId) {
            await updateStudent(editingId, student);
        } else {
            await addStudent(student);
        }
        window.location.href = 'index.html';
    } catch (err) {
        if (err.errors) {
            const errs = typeof err.errors === 'object'
                ? Object.values(err.errors).join('<br>')
                : err.errors;
            errorsContainer.innerHTML = errs;
        } else {
            errorsContainer.textContent = 'Ошибка при сохранении';
        }
    }
    return false;
};

init();