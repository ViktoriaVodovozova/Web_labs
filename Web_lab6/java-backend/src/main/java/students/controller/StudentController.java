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

    @RequestMapping
    public ResponseEntity<List<StudentResponse>> getAll(
        @RequestParam(required = false) String group,
        @RequestParam(required = false) Integer dormitory,
        @RequestParam(required = false) Boolean isForeigner,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "fullName") String sortBy,
        @RequestParam(defaultValue = "asc") String direction,
        jakarta.servlet.http.HttpServletRequest httpRequest
    ) {
        if (!"QUERY".equals(httpRequest.getMethod())) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.METHOD_NOT_ALLOWED);
        Page<StudentResponse> result = service.getAll(
            group, dormitory, isForeigner, search, page, size, sortBy, direction
        );
        return ResponseEntity.ok()
            .header("X-Total-Count", Long.toString(result.getTotalElements()))
            .header("X-Total-Pages", Integer.toString(result.getTotalPages()))
            .header("X-Page", Integer.toString(result.getNumber()))
            .body(result.getContent());
    }

    @RequestMapping("/{id}")
    public ResponseEntity<StudentResponse> getById(@PathVariable String id, jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (!"QUERY".equals(httpRequest.getMethod())) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.METHOD_NOT_ALLOWED);
        StudentResponse student = service.getById(id);
        return ResponseEntity.ok().eTag(student.etag()).body(student);
    }

    @PostMapping
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.status(201).body(service.create(request));
    }

    @PutMapping("/{id}")
    public StudentResponse replace(@PathVariable String id, @Valid @RequestBody StudentRequest request,
                                   @RequestHeader(name = "If-Match", required = false) String expectedTag) {
        return service.replace(id, request, expectedTag);
    }

    @PatchMapping("/{id}")
    public StudentResponse update(@PathVariable String id, @RequestBody StudentUpdateRequest request,
                                  @RequestHeader(name = "If-Match", required = false) String expectedTag) {
        return service.update(id, request, expectedTag);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

}