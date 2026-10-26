package students.entity;
import jakarta.persistence.*;
import java.time.LocalDate;
@Entity
@Table(name = "students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;
    @Column(name = "full_name", nullable = false, length = 200)
    public String fullName;
    @Column(name = "student_group", nullable = false, length = 100)
    public String group;
    @Column(name = "isu_id", nullable = false, unique = true, length = 6)
    public String isuId;
    @Column(nullable = false)
    public Integer dormitory;
    @Column(nullable = false)
    public Integer room;
    @Column(name = "move_in_date", nullable = false)
    public LocalDate moveInDate;
    @Column(name = "is_foreigner", nullable = false)
    public boolean isForeigner;
    @Column(nullable = false, length = 5000)
    public String notes = "";
}
