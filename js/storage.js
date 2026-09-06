const STORAGE_KEY = 'students';

// получить всех студентов
export function getStudents() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// сохранить весь массив
export function saveStudents(students) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// добавить одного
export function addStudent(student) {
    const students = getStudents();
    students.push(student);
    saveStudents(students);
}

// обновить по id
export function updateStudent(id, updatedStudent) {
    const students = getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index !== -1) {
        students[index] = updatedStudent;
        saveStudents(students);
    }
}

// удалить по id
export function deleteStudent(id) {
    const students = getStudents();
    const filtered = students.filter(s => s.id !== id);
    saveStudents(filtered);
}