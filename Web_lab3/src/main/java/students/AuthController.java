package students;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) { this.service = service; }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(service.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return service.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return service.refresh(request);
    }

    public record RegisterRequest(
        @NotBlank
        @Pattern(regexp = "^[a-zA-Z0-9_]{3,50}$") String username,
        @NotBlank
        @Email
        @Size(max = 254) String email,
        @NotBlank
        @Size(min = 8, max = 72) String password
    ) {}

    public record LoginRequest(
        @NotBlank
        @Size(max = 50) String username,
        @NotBlank
        @Size(max = 72) String password
    ) {}

    public record RefreshRequest(
        @NotBlank
        @Size(max = 4096) String refreshToken
    ) {}

    public record AuthResponse(String accessToken, String refreshToken, String tokenType,
        long expiresIn, String username, String role) {}
}
