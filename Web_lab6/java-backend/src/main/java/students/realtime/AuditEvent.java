package students.realtime;

public record AuditEvent(
    String eventId,
    String action,
    String entityId,
    String occurredAt,
    Actor actor,
    Object before,
    Object after
) {
    public record Actor(String id, String username, String role) {}
}