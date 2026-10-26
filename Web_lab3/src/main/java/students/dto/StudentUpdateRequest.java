package students.dto;

import java.time.LocalDate;

public record StudentUpdateRequest(
    String fullName,
    String group,
    String isuId,
    Integer dormitory,
    Integer room,
    LocalDate moveInDate,
    Boolean isForeigner,
    String notes
) {}