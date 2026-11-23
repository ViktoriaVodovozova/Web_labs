package students.service;

import students.dto.*;
import students.entity.Student;
import students.entity.User;
import students.realtime.RealtimeNotifier;
import students.repository.StudentRepository;
import students.repository.UserRepository;
import students.exception.ErrorHandler.ApiException;

import jakarta.validation.Validator;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.*;

@Service
public class StudentService {
    private static final Logger log = LoggerFactory.getLogger(StudentService.class);
    private static final Set<String> SORT_FIELDS = Set.of("id", "fullName", "group", "isuId", "dormitory", "room", "moveInDate", "isForeigner");

    private final StudentRepository students;
    private final UserRepository users;
    private final Validator validator;
    private final RealtimeNotifier notifier;

    public StudentService(StudentRepository students, UserRepository users, Validator validator, RealtimeNotifier notifier) {
        this.students = students;
        this.users = users;
        this.validator = validator;
        this.notifier = notifier;
    }

    private User getCurrentActor() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return users.findByUsername(auth.getName()).orElse(null);
    }

    @Transactional(readOnly = true)
    public Page<StudentResponse> getAll(String group, Integer dormitory, Boolean isForeigner, String search, int page, int size, String sortBy, String direction) {
        if (page < 0 || size < 1 || size > 100) throw new ApiException(400, "page от 0, size от 1 до 100");
        if (dormitory != null && dormitory < 1) throw new ApiException(400, "Номер общежития положительный");
        if (!SORT_FIELDS.contains(sortBy)) throw new ApiException(400, "Неизвестное поле сортировки");
        if (!direction.equalsIgnoreCase("asc") && !direction.equalsIgnoreCase("desc")) throw new ApiException(400, "direction asc или desc");
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        if (!sortBy.equals("id")) sort = sort.and(Sort.by("id"));
        return students.search(emptyToNull(group), dormitory, isForeigner, emptyToNull(search), PageRequest.of(page, size, sort)).map(StudentResponse::fromStudent);
    }

    @Transactional(readOnly = true)
    public StudentResponse getById(String id) {
        return StudentResponse.fromStudent(findStudent(id));
    }

    @Transactional
    public StudentResponse create(StudentRequest request) {
        StudentRequest data = normalize(request);
        validate(data);
        if (students.existsByIsuId(data.isuId())) throw new ApiException(409, "Студент с таким ИСУ ID уже существует");
        Student student = new Student();
        fillStudent(student, data);
        students.saveAndFlush(student);

        User actor = getCurrentActor();
        if (actor != null) notifier.sendEvent("STUDENT_CREATED", student.id, actor, null, StudentResponse.fromStudent(student));
        return StudentResponse.fromStudent(student);
    }

    @Transactional
    public StudentResponse replace(String id, StudentRequest request, String expectedTag) {
        Student student = findForUpdate(id);
        if (expectedTag == null || expectedTag.isBlank()) {
            throw new ApiException(428, "Для изменения записи необходим заголовок If-Match (ETag из QUERY /api/requests/{id})");
        }
        if (!StudentResponse.fromStudent(student).etag().equals(expectedTag)) {
            throw new ApiException(412, "Студент изменился после чтения");
        }
        return replace(student, request);
    }

    private StudentResponse replace(Student student, StudentRequest request) {
        StudentRequest data = normalize(request);
        validate(data);
        checkIsu(data.isuId(), student.id);
        StudentResponse before = StudentResponse.fromStudent(student);
        fillStudent(student, data);
        students.saveAndFlush(student);

        User actor = getCurrentActor();
        if (actor != null) notifier.sendEvent("STUDENT_UPDATED", student.id, actor, before, StudentResponse.fromStudent(student));
        return StudentResponse.fromStudent(student);
    }

    @Transactional
    public StudentResponse update(String id, StudentUpdateRequest request, String expectedTag) {
        Student student = findForUpdate(id);
        if (expectedTag == null || expectedTag.isBlank()) {
            throw new ApiException(428, "Для изменения записи необходим заголовок If-Match");
        }
        if (!StudentResponse.fromStudent(student).etag().equals(expectedTag)) {
            throw new ApiException(412, "Студент изменился после чтения. Обновите страницу");
        }
        StudentRequest merged = new StudentRequest(
            request.fullName() != null ? request.fullName() : student.fullName,
            request.group() != null ? request.group() : student.group,
            request.isuId() != null ? request.isuId() : student.isuId,
            request.dormitory() != null ? request.dormitory() : student.dormitory,
            request.room() != null ? request.room() : student.room,
            request.moveInDate() != null ? request.moveInDate() : student.moveInDate,
            request.isForeigner() != null ? request.isForeigner() : student.isForeigner,
            request.notes() != null ? request.notes() : student.notes
        );
        return replace(student, merged);
    }

    @Transactional
    public void delete(String id) {
        Student student = findForUpdate(id);
        students.delete(student);

        User actor = getCurrentActor();
        if (actor != null) notifier.sendEvent("STUDENT_DELETED", student.id, actor, StudentResponse.fromStudent(student), null);
    }


    private Student findForUpdate(String id) {
        return students.findForUpdate(id).orElseThrow(() -> new ApiException(404, "Студент не найден"));
    }

    private Student findStudent(String id) { return students.findById(id).orElseThrow(() -> new ApiException(404, "Студент не найден")); }
    private void checkIsu(String isuId, String id) { if (students.existsByIsuIdAndIdNot(isuId, id)) throw new ApiException(409, "Студент с таким ИСУ ID уже существует"); }
    private void validate(StudentRequest data) {
        Map<String, String> errors = new LinkedHashMap<>();
        validator.validate(data).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        if (data.moveInDate() != null && data.moveInDate().isBefore(LocalDate.of(1970, 8, 25))) errors.put("moveInDate", "Дата не может быть раньше 25.08.1970");
        if (!errors.isEmpty()) throw new ApiException(422, "Ошибка валидации", errors);
    }
    private StudentRequest normalize(StudentRequest r) {
        return new StudentRequest(r.fullName() == null ? null : r.fullName().trim(), r.group() == null ? null : r.group().trim(), r.isuId(), r.dormitory(), r.room(), r.moveInDate(), r.isForeigner(), r.notes() == null ? "" : r.notes().trim());
    }
    private void fillStudent(Student s, StudentRequest r) {
        s.fullName = r.fullName(); s.group = r.group(); s.isuId = r.isuId(); s.dormitory = r.dormitory(); s.room = r.room(); s.moveInDate = r.moveInDate(); s.isForeigner = r.isForeigner(); s.notes = r.notes();
    }
    private String emptyToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}