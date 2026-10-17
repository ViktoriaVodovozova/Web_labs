package students;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
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
        @RequestParam(defaultValue = "asc") String direction) {
        Page<StudentResponse> result = service.getAll(group, dormitory, isForeigner,
            search, page, size, sortBy, direction);
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
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.status(201).body(service.create(request));
    }

    @PutMapping("/{id}")
    public StudentResponse replace(@PathVariable String id, @Valid @RequestBody StudentRequest request) {
        return service.replace(id, request);
    }

    @PatchMapping("/{id}")
    public StudentResponse update(@PathVariable String id, @RequestBody StudentUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    public record StudentRequest(
        @NotBlank
        @Size(max = 200)
        @Pattern(regexp = "^[a-zA-Zа-яА-ЯёЁ\\s\\-']+$") String fullName,
        @NotBlank
        @Size(max = 100) String group,
        @NotBlank
        @Pattern(regexp = "^[0-9]{6}$") String isuId,
        @NotNull
        @Min(value = 1) Integer dormitory,
        @NotNull
        @Min(value = 1) Integer room,
        @NotNull
        @PastOrPresent LocalDate moveInDate, boolean isForeigner,
        @Size(max = 5000) String notes
    ) {}

    public record StudentUpdateRequest(String fullName, String group, String isuId, Integer dormitory, Integer room, LocalDate moveInDate, Boolean isForeigner, String notes) {}

    public record StudentResponse(String id, String fullName, String group, String isuId, Integer dormitory, Integer room, LocalDate moveInDate, boolean isForeigner, String notes) {
        public static StudentResponse fromStudent(Student s) {
            return new StudentResponse(s.id, s.fullName, s.group, s.isuId,
                s.dormitory, s.room, s.moveInDate, s.isForeigner, s.notes);
        }
    }
}
