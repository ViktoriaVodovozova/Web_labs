package students.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

public final class RateLimitFilter extends OncePerRequestFilter {

    private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
            .maximumSize(100_000)
            .expireAfterAccess(Duration.ofMinutes(20))
            .build();

    private record Policy(int capacity, String category) {}

    private Policy resolvePolicy(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        String method = request.getMethod();
        if ("POST".equalsIgnoreCase(method) && "/api/auth/login".equals(path)) {
            return new Policy(5, "login");
        }
        if ("POST".equalsIgnoreCase(method) && "/api/auth/register".equals(path)) {
            return new Policy(3, "register");
        }
        if ("POST".equalsIgnoreCase(method) && "/api/auth/refresh".equals(path)) {
            return new Policy(10, "refresh");
        }
        if (path.equals("/api/requests") || path.startsWith("/api/requests/")) {
            return new Policy(100, "requests");
        }
        return new Policy(60, "default");
    }

    private Bucket createBucket(int capacity) {
        Bandwidth bandwidth = Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(bandwidth).build();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        Policy policy = resolvePolicy(request);
        String key = request.getRemoteAddr() + ":" + policy.category();
        Bucket bucket = buckets.get(key, ignored -> createBucket(policy.capacity()));
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        response.setHeader("X-RateLimit-Limit", Integer.toString(policy.capacity()));
        response.setHeader("X-RateLimit-Remaining", Long.toString(probe.getRemainingTokens()));

        if (probe.isConsumed()) {
            chain.doFilter(request, response);
            return;
        }

        long nanos = probe.getNanosToWaitForRefill();
        long waitSeconds = Math.max(1L, nanos / 1_000_000_000L + (nanos % 1_000_000_000L == 0 ? 0 : 1));
        response.setStatus(429);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setHeader("Retry-After", Long.toString(waitSeconds));
        response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\","
                + "\"message\":\"Превышен лимит запросов\",\"retryAfter\":" + waitSeconds + "}");
    }
}
