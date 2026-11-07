package students.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_events")
public class AuditEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, updatable = false)
    public Instant occurredAt = Instant.now();
    @Column(nullable = false, updatable = false, length = 50)
    public String username;
    @Column(nullable = false, updatable = false, length = 20)
    public String action;
    @Column(nullable = false, updatable = false, length = 36)
    public String studentId;
    @Column(nullable = false, updatable = false, length = 200)
    public String studentName;
}
