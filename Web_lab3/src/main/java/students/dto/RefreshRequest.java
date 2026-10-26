package students.dto;

import jakarta.validation.constraints.*;

public record RefreshRequest(
    @NotBlank
    @Size(max = 4096)
    String refreshToken
) {}