package students.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import students.entity.AuditEvent;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {}
