import { getStudents, getStudentById, addStudent, updateStudent, deleteStudent } from './storage.js';
import { validateStudent } from './validation.js';
import { renderStudentTable, renderForm, renderProfile } from './render.js';
import { requireLogin, isAdmin, errorText } from './auth.js';

const listPage = document.getElementById('list-page');
const formPage = document.getElementById('form-page');
const profilePage = document.getElementById('profile-page');
let students = [];
let editingId = null;
let page = 0;
let pages = 0;
let filters = {};

function showError(error) {
    document.getElementById('page-error').textContent = errorText(error);
}

async function loadStudents() {
    document.getElementById('page-error').textContent = '';
    try {
        let result = await getStudents({ ...filters, page, size: 10 });
        if (page > 0 && page >= result.pages) {
            page = Math.max(0, result.pages - 1);
            result = await getStudents({ ...filters, page, size: 10 });
        }
        students = result.students;
        pages = result.pages;
        renderStudentTable(students, document.getElementById('student-table-body'), isAdmin());
        document.getElementById('page-info').textContent = `Страница ${pages ? page + 1 : 0} из ${pages}. Всего: ${result.total}`;
        document.getElementById('prev-page').disabled = page === 0;
        document.getElementById('next-page').disabled = page + 1 >= pages;
    } catch (error) { showError(error); }
}

async function handleTableClick(event) {
    const button = event.target.closest('button.delete');
    if (!button) return;
    const student = students.find(s => s.id === button.dataset.id);
    if (!student || !confirm(`Удалить студента «${student.fullName}»?`)) return;
    button.disabled = true;
    try { await deleteStudent(student.id); await loadStudents(); }
    catch (error) { button.disabled = false; showError(error); }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const student = {
        fullName: data.get('fullName').trim(), group: data.get('group').trim(),
        isuId: data.get('isuId').trim(), dormitory: Number(data.get('dormitory')),
        room: Number(data.get('room')), moveInDate: data.get('moveInDate'),
        isForeigner: data.get('isForeigner') === 'on', notes: data.get('notes').trim()
    };
    const errors = validateStudent(student);
    const container = document.getElementById('form-errors');
    container.textContent = Object.values(errors).join('\n');
    if (Object.keys(errors).length) return;
    const save = document.getElementById('save-btn');
    save.disabled = true;
    try {
        if (editingId) await updateStudent(editingId, student);
        else await addStudent(student);
        window.location.href = 'index.html';
    } catch (error) { container.textContent = errorText(error); }
    finally { save.disabled = false; }
}

async function init() {
    if (!requireLogin()) return;
    const id = new URLSearchParams(window.location.search).get('id');
    if (listPage) {
        document.getElementById('add-link').hidden = !isAdmin();
        document.getElementById('student-table-body').addEventListener('click', handleTableClick);
        document.getElementById('filter-btn').addEventListener('click', () => {
            filters = {
                search: document.getElementById('search').value.trim(),
                group: document.getElementById('filter-group').value.trim(),
                dormitory: document.getElementById('filter-dormitory').value,
                isForeigner: document.getElementById('filter-foreigner').value,
                sortBy: document.getElementById('sort-by').value,
                direction: document.getElementById('direction').value
            };
            page = 0;
            loadStudents();
        });
        document.getElementById('prev-page').addEventListener('click', () => { if (page > 0) { page--; loadStudents(); } });
        document.getElementById('next-page').addEventListener('click', () => { if (page + 1 < pages) { page++; loadStudents(); } });
        await loadStudents();
    }
    if (formPage) {
        if (!isAdmin()) {
            document.getElementById('student-form').hidden = true;
            showError({ message: 'Изменять студентов может только ADMIN' });
            return;
        }
        const student = id ? await getStudentById(id) : null;
        if (id && !student) {
            document.getElementById('student-form').hidden = true;
            showError({ message: 'Студент не найден' });
            return;
        }
        editingId = id;
        document.getElementById('form-title').textContent = id ? 'Редактирование студента' : 'Добавление студента';
        renderForm(student);
        document.getElementById('student-form').addEventListener('submit', handleFormSubmit);
    }
    if (profilePage) renderProfile(id ? await getStudentById(id) : null, document.getElementById('profile-content'));
}

init().catch(showError);
