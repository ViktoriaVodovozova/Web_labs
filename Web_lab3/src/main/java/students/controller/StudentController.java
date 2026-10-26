package students.controller;

import students.service.StudentService;
import students.dto.StudentRequest;
import students.dto.StudentUpdateRequest;
import students.dto.StudentResponse;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@SecurityRequirement(name = "bearerAuth")
public class StudentController {
    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<StudentResponse>> getAll(
        @RequestParam(required = false) String group,
        @RequestParam(required = false) Integer dormitory,
        @RequestParam(required = false) Boolean isForeigner,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "fullName") String sortBy,
        @RequestParam(defaultValue = "asc") String direction
    ) {
        Page<StudentResponse> result = service.getAll(
            group, dormitory, isForeigner,
            search, page, size, sortBy, direction
        );

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
    public ResponseEntity<StudentResponse> create(
        @Valid @RequestBody StudentRequest request
    ) {
        return ResponseEntity.status(201).body(service.create(request));
    }

    @PutMapping("/{id}")
    public StudentResponse replace(
        @PathVariable String id,
        @Valid @RequestBody StudentRequest request
    ) {
        return service.replace(id, request);
    }

    @PatchMapping("/{id}")
    public StudentResponse update(
        @PathVariable String id,
        @RequestBody StudentUpdateRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}