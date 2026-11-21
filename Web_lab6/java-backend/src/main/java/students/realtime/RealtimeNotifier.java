package students.realtime;

import students.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.UUID;

@Service
public class RealtimeNotifier {
    private static final Logger log = LoggerFactory.getLogger(RealtimeNotifier.class);
    private final RestTemplate rest;

    public RealtimeNotifier() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(1500);
        factory.setReadTimeout(1500);
        rest = new RestTemplate(factory);
    }

    @Value("${app.realtime.url}")
    private String url;

    @Value("${app.realtime.service-key}")
    private String serviceKey;

    public void sendEvent(String action, String entityId, User actor, Object before, Object after) {
        var event = new AuditEvent(
            UUID.randomUUID().toString(), action, entityId, Instant.now().toString(),
            new AuditEvent.Actor(actor.id, actor.username, actor.role), before, after
        );
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deliver(event, action);
            }
        });
    }

    private void deliver(AuditEvent event, String action) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-service-key", serviceKey);

            HttpEntity<AuditEvent> request = new HttpEntity<>(event, headers);
            rest.postForEntity(url, request, Void.class);
            log.debug("Событие {} отправлено в Node.js", action);
        } catch (Exception e) {
            log.error("Не удалось отправить событие в Node.js: {}", e.getMessage());
        }
    }
}
