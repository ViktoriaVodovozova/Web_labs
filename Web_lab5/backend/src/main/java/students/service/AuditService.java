package students.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import students.entity.AuditEvent;
import students.dto.StudentResponse;
import students.repository.AuditEventRepository;
import java.util.List;

@Service
public class AuditService {
    private final AuditEventRepository events;
    public AuditService(AuditEventRepository events) { this.events = events; }

    @Transactional
    public void record(String username, String action, StudentResponse student) {
        AuditEvent event = new AuditEvent();
        event.username = username;
        event.action = action;
        event.studentId = student.id();
        event.studentName = student.fullName();
        events.save(event);
    }

    @Transactional(readOnly = true)
    public List<AuditEvent> recent() {
        return events.findAll(PageRequest.of(0, 30, Sort.by(Sort.Direction.DESC, "occurredAt", "id"))).getContent();
    }
}
