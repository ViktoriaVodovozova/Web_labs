import { getStudents, addStudent, updateStudent, deleteStudent } from './storage.js';
import { validateStudent } from './validation.js';
import { renderStudentTable, renderForm, renderProfile } from './render.js';

const listPage = document.getElementById('list-page');
const formPage = document.getElementById('form-page');
const profilePage = document.getElementById('profile-page');

let students = [];
let editingId = null;

function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function init() {
    students = getStudents();

    if (listPage) {
        renderStudentTable(students, document.getElementById('student-table-body'));
        document.getElementById('student-table-body').addEventListener('click', handleTableClick);
    }

    if (formPage) {
        const id = getParam('id');
        let student = null;
        if (id) {
            student = students.find(s => s.id === id);
            editingId = id;
            document.getElementById('form-title').textContent = ' Редактирование студента';
        } else {
            document.getElementById('form-title').textContent = ' Добавление студента';
            editingId = null;
        }
        renderForm(student);
        console.log('Обработчик формы привязан через onsubmit');
    }

    if (profilePage) {
        const id = getParam('id');
        if (id) {
            const student = students.find(s => s.id === id);
            renderProfile(student, document.getElementById('profile-content'));
        } else {
            document.getElementById('profile-content').innerHTML = '<p>Студент не найден</p>';
        }
    }
}

function handleTableClick(e) {
    const target = e.target;
    if (!target.classList.contains('delete')) return;
    const id = target.dataset.id;
    if (!id) return;
    const student = students.find(s => s.id === id);
    if (!student) return;
    if (confirm(`Удалить студента "${student.fullName}"?`)) {
        deleteStudent(id);
        students = getStudents();
        renderStudentTable(students, document.getElementById('student-table-body'));
    }
}

// глобальная функция для вызова из onsubmit
window.handleFormSubmit = function(e) {
    e.preventDefault();
    console.log('Обработчик формы сработал через onsubmit!');

    const form = document.getElementById('student-form');
    const formData = new FormData(form);
    const student = {
        id: document.getElementById('edit-id').value || Date.now().toString(),
        fullName: formData.get('fullName').trim(),
        group: formData.get('group').trim(),
        isuId: formData.get('isuId').trim(),
        dormitory: Number(formData.get('dormitory')),
        room: Number(formData.get('room')),
        moveInDate: formData.get('moveInDate'),
        isForeigner: formData.get('isForeigner') === 'on',
        notes: formData.get('notes').trim()
    };

    const errors = validateStudent(student);
    const errorsContainer = document.getElementById('form-errors');
    if (Object.keys(errors).length > 0) {
        errorsContainer.innerHTML = Object.values(errors).join('<br>');
        return false;
    }
    errorsContainer.textContent = '';

    if (editingId) {
        updateStudent(editingId, student);
    } else {
        addStudent(student);
    }

    console.log('Редирект на index.html');
    window.location.href = 'index.html';
    return false;
};

init(); // http://127.0.0.1:8000
// python3 -m http.server
