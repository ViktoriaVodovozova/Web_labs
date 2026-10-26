package students.dto;

import students.entity.Student;
import java.time.LocalDate;

public record StudentResponse(
    String id,
    String fullName,
    String group,
    String isuId,
    Integer dormitory,
    Integer room,
    LocalDate moveInDate,
    boolean isForeigner,
    String notes
) {
    public static StudentResponse fromStudent(Student s) {
        return new StudentResponse(
            s.id,
            s.fullName,
            s.group,
            s.isuId,
            s.dormitory,
            s.room,
            s.moveInDate,
            s.isForeigner,
            s.notes
        );
    }
}