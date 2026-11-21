package students.dto;

import java.time.LocalDate;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import students.entity.Student;

public record StudentResponse(String id, String fullName, String group, String isuId, Integer dormitory, Integer room, LocalDate moveInDate, boolean isForeigner, String notes) {
    public String etag() {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            for (Object value : new Object[] {id, fullName, group, isuId, dormitory, room, moveInDate, isForeigner, notes}) {
                String text = value == null ? "" : value.toString();
                digest.update(((value == null ? -1 : text.length()) + ":").getBytes(StandardCharsets.UTF_8));
                digest.update(text.getBytes(StandardCharsets.UTF_8));
            }
            return "\"" + HexFormat.of().formatHex(digest.digest()) + "\"";
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public static StudentResponse fromStudent(Student s) {
        return new StudentResponse(s.id, s.fullName, s.group, s.isuId,
            s.dormitory, s.room, s.moveInDate, s.isForeigner, s.notes);
    }
}
