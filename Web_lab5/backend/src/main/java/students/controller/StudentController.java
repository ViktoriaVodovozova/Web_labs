package students.controller;

import students.service.StudentService;
import students.service.AuditService;
import org.springframework.security.core.Authentication;
import students.dto.*;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import jakarta.validation.Valid;
import java.time.LocalDate;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
@SecurityRequirement(name = "bearerAuth")
public class StudentController {
    private final StudentService service;
    private final AuditService audit;

    public StudentController(StudentService service, AuditService audit) {
        this.service = service;
        this.audit = audit;
    }

    @GetMapping
    public ResponseEntity<List<StudentResponse>> getAll(
        @RequestParam(required = false) String group,
        @RequestParam(required = false) Integer dormitory,
        @RequestParam(required = false) Boolean isForeigner,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String id,
        @RequestParam(required = false) String fullName,
        @RequestParam(required = false) String isuId,
        @RequestParam(required = false) Integer room,
        @RequestParam(required = false) LocalDate moveInDate,
        @RequestParam(required = false) String notes,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "fullName") String sortBy,
        @RequestParam(defaultValue = "asc") String direction) {
        Page<StudentResponse> result = service.getAll(group, dormitory, isForeigner,
            search, id, fullName, isuId, room, moveInDate, notes, page, size, sortBy, direction);
        return ResponseEntity.ok()
            .header("X-Total-Count", Long.toString(result.getTotalElements()))
            .header("X-Total-Pages", Integer.toString(result.getTotalPages()))
            .header("X-Page", Integer.toString(result.getNumber()))
            .body(result.getContent());
    }

    @GetMapping("/{id}")
    public StudentResponse getById(@PathVariable String id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentRequest request, Authentication auth) {
        StudentResponse student = service.create(request);
        audit.record(auth.getName(), "CREATE", student);
        return ResponseEntity.status(201).body(student);
    }

    @PutMapping("/{id}")
    public StudentResponse replace(@PathVariable String id, @Valid @RequestBody StudentRequest request, Authentication auth) {
        StudentResponse student = service.replace(id, request);
        audit.record(auth.getName(), "UPDATE", student);
        return student;
    }

    @PatchMapping("/{id}")
    public StudentResponse update(@PathVariable String id, @RequestBody StudentUpdateRequest request, Authentication auth) {
        StudentResponse student = service.update(id, request);
        audit.record(auth.getName(), "UPDATE", student);
        return student;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        StudentResponse student = service.getById(id);
        service.delete(id);
        audit.record(auth.getName(), "DELETE", student);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    public StudentResponse restore(@PathVariable String id, Authentication auth) {
        StudentResponse student = service.restore(id);
        audit.record(auth.getName(), "RESTORE", student);
        return student;
    }

}
