package students.controller;

import students.service.AuthService;
import students.dto.*;
import students.exception.ErrorHandler;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;

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

    @RequestMapping("/me")
    public ProfileResponse me(java.security.Principal principal, jakarta.servlet.http.HttpServletRequest httpRequest) {
        if (!"QUERY".equals(httpRequest.getMethod())) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.METHOD_NOT_ALLOWED);
        if (principal == null) throw new ErrorHandler.ApiException(401, "Необходима авторизация");
        return service.profile(principal.getName());
    }

}
