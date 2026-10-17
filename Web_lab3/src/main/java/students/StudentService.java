package students;

import jakarta.validation.Validator;
import students.StudentController.*;
import students.ErrorHandler.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
public class StudentService {
    private static final Logger log = LoggerFactory.getLogger(StudentService.class);
    private static final Set<String> SORT_FIELDS = Set.of("id", "fullName", "group", "isuId",
        "dormitory", "room", "moveInDate", "isForeigner");
    private final StudentRepository students;
    private final Validator validator;

    public StudentService(StudentRepository students, Validator validator) {
        this.students = students;
        this.validator = validator;
    }

    @Transactional(readOnly = true)
    public Page<StudentResponse> getAll(String group, Integer dormitory, Boolean isForeigner,
        String search, int page, int size, String sortBy, String direction) {
        if (page < 0 || size < 1 || size > 100)
            throw new ApiException(400, "page должен быть от 0, size — от 1 до 100");
        if (dormitory != null && dormitory < 1)
            throw new ApiException(400, "Номер общежития должен быть положительным");
        if (!SORT_FIELDS.contains(sortBy)) throw new ApiException(400, "Неизвестное поле сортировки");
        if (!direction.equalsIgnoreCase("asc") && !direction.equalsIgnoreCase("desc"))
            throw new ApiException(400, "direction должен быть asc или desc");
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        if (!sortBy.equals("id")) sort = sort.and(Sort.by("id"));
        return students.search(emptyToNull(group), dormitory, isForeigner, emptyToNull(search),
            PageRequest.of(page, size, sort)).map(StudentResponse::fromStudent);
    }

    @Transactional(readOnly = true)
    public StudentResponse getById(String id) {
        return StudentResponse.fromStudent(findStudent(id));
    }

    public StudentResponse create(StudentRequest request) {
        StudentRequest data = normalize(request);
        validate(data);
        if (students.existsByIsuId(data.isuId()))
            throw new ApiException(409, "Студент с таким ИСУ ID уже существует");
        Student student = new Student();
        fillStudent(student, data);
        students.saveAndFlush(student);
        log.info("Создан студент {}", student.id);
        return StudentResponse.fromStudent(student);
    }

    public StudentResponse replace(String id, StudentRequest request) {
        Student student = findStudent(id);
        StudentRequest data = normalize(request);
        validate(data);
        checkIsu(data.isuId(), id);
        fillStudent(student, data);
        students.saveAndFlush(student);
        log.info("Полностью обновлён студент {}", id);
        return StudentResponse.fromStudent(student);
    }

    public StudentResponse update(String id, StudentUpdateRequest request) {
        Student student = findStudent(id);
        StudentRequest merged = new StudentRequest(
            request.fullName() != null ? request.fullName() : student.fullName,
            request.group() != null ? request.group() : student.group,
            request.isuId() != null ? request.isuId() : student.isuId,
            request.dormitory() != null ? request.dormitory() : student.dormitory,
            request.room() != null ? request.room() : student.room,
            request.moveInDate() != null ? request.moveInDate() : student.moveInDate,
            request.isForeigner() != null ? request.isForeigner() : student.isForeigner,
            request.notes() != null ? request.notes() : student.notes);
        return replace(id, merged);
    }

    public void delete(String id) {
        students.delete(findStudent(id));
        log.info("Удалён студент {}", id);
    }

    private Student findStudent(String id) {
        return students.findById(id).orElseThrow(() -> new ApiException(404, "Студент не найден"));
    }

    private void checkIsu(String isuId, String id) {
        if (students.existsByIsuIdAndIdNot(isuId, id))
            throw new ApiException(409, "Студент с таким ИСУ ID уже существует");
    }

    private void validate(StudentRequest data) {
        Map<String, String> errors = new LinkedHashMap<>();
        validator.validate(data).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        if (data.moveInDate() != null && data.moveInDate().isBefore(LocalDate.of(1970, 8, 25)))
            errors.put("moveInDate", "Дата не может быть раньше 25.08.1970");
        if (!errors.isEmpty()) throw new ApiException(422, "Ошибка валидации", errors);
    }

    private StudentRequest normalize(StudentRequest r) {
        return new StudentRequest(r.fullName() == null ? null : r.fullName().trim(),
            r.group() == null ? null : r.group().trim(), r.isuId(), r.dormitory(), r.room(),
            r.moveInDate(), r.isForeigner(), r.notes() == null ? "" : r.notes().trim());
    }

    private void fillStudent(Student s, StudentRequest r) {
        s.fullName = r.fullName();
        s.group = r.group();
        s.isuId = r.isuId();
        s.dormitory = r.dormitory();
        s.room = r.room();
        s.moveInDate = r.moveInDate();
        s.isForeigner = r.isForeigner();
        s.notes = r.notes();
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
