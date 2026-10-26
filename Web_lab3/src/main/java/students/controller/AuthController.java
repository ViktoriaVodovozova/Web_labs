package students.controller;

import students.service.AuthService;
import students.dto.RegisterRequest;
import students.dto.LoginRequest;
import students.dto.RefreshRequest;
import students.dto.AuthResponse;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
        @Valid @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.status(201).body(service.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(
        @Valid @RequestBody LoginRequest request
    ) {
        return service.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(
        @Valid @RequestBody RefreshRequest request
    ) {
        return service.refresh(request);
    }
}