package students.service;

import students.dto.*;
import students.entity.User;
import students.repository.UserRepository;
import students.exception.ErrorHandler.ApiException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.time.Instant;
import javax.crypto.SecretKey;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final SecretKey key;
    private final long accessSeconds;
    private final long refreshSeconds;

    public AuthService(
        UserRepository users,
        PasswordEncoder encoder,
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.access-seconds}") long accessSeconds,
        @Value("${app.jwt.refresh-seconds}") long refreshSeconds
    ) {
        this.users = users;
        this.encoder = encoder;
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessSeconds = accessSeconds;
        this.refreshSeconds = refreshSeconds;
    }

    @Transactional
    public AuthResponse register(RegisterRequest r) {
        String email = r.email().toLowerCase(Locale.ROOT);

        if (r.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(422, "Пароль не должен превышать 72 байта");
        }

        if (users.existsByUsername(r.username())) {
            throw new ApiException(409, "Имя пользователя уже занято");
        }

        if (users.existsByEmail(email)) {
            throw new ApiException(409, "Почта уже используется");
        }

        User user = users.saveAndFlush(new User(
            r.username(),
            email,
            encoder.encode(r.password()),
            "USER"
        ));

        log.info("Зарегистрирован пользователь {}", user.id);
        return response(user);
    }

    public AuthResponse login(LoginRequest r) {
        if (r.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(401, "Неверное имя пользователя или пароль");
        }

        User user = users.findByUsername(r.username())
            .orElseThrow(() ->
                new ApiException(401, "Неверное имя пользователя или пароль")
            );

        if (!encoder.matches(r.password(), user.passwordHash)) {
            throw new ApiException(401, "Неверное имя пользователя или пароль");
        }

        log.info("Вход пользователя {}", user.id);
        return response(user);
    }

    public AuthResponse refresh(RefreshRequest r) {
        String id = parse(r.refreshToken(), "refresh").getSubject();

        User user = users.findById(id)
            .orElseThrow(() -> new ApiException(401, "Пользователь не найден"));

        return response(user);
    }

    private AuthResponse response(User user) {
        return new AuthResponse(
            token(user, "access", accessSeconds),
            token(user, "refresh", refreshSeconds),
            "Bearer",
            accessSeconds,
            user.username,
            user.role
        );
    }

    public Claims parse(String token, String type) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer("students-api")
                .build()
                .parseSignedClaims(token)
                .getPayload();

            if (!type.equals(claims.get("type"))
                || claims.getSubject() == null
                || claims.getExpiration() == null) {
                throw new ApiException(401, "Недействительный токен");
            }

            return claims;
        } catch (JwtException | IllegalArgumentException e) {
            throw new ApiException(401, "Токен недействителен или истёк");
        }
    }

    private String token(User user, String type, long seconds) {
        Instant now = Instant.now();

        return Jwts.builder()
            .issuer("students-api")
            .subject(user.id)
            .id(UUID.randomUUID().toString())
            .claim("type", type)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(seconds)))
            .signWith(key)
            .compact();
    }
}