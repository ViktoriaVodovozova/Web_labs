package students.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record StudentRequest(
    @NotBlank
    @Size(max = 200)
    @Pattern(regexp = "^[a-zA-Zа-яА-ЯёЁ\\s\\-']+$")
    String fullName,

    @NotBlank
    @Size(max = 100)
    String group,

    @NotBlank
    @Pattern(regexp = "^[0-9]{6}$")
    String isuId,

    @NotNull
    @Min(1)
    Integer dormitory,

    @NotNull
    @Min(1)
    Integer room,

    @NotNull
    @PastOrPresent
    LocalDate moveInDate,

    boolean isForeigner,

    @Size(max = 5000)
    String notes
) {}