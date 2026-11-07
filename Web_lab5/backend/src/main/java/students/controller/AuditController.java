package students.controller;

import org.springframework.web.bind.annotation.*;
import students.entity.AuditEvent;
import students.service.AuditService;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {
    private final AuditService audit;
    public AuditController(AuditService audit) { this.audit = audit; }

    @GetMapping
    public List<AuditEvent> recent() { return audit.recent(); }
}
