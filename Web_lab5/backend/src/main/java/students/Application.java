package students;

import students.repository.UserRepository;
import students.entity.User;

import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;

@SpringBootApplication
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    CommandLineRunner createAdmin(UserRepository users, PasswordEncoder encoder,
        @Value("${app.admin.password:}") String password) {
        return args -> {
            if (!password.isBlank() && !users.existsByUsername("admin")) {
                if (password.length() < 8 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
                    throw new IllegalArgumentException("Пароль администратора: от 8 символов до 72 байт");
                users.save(new User("admin", "admin@example.com", encoder.encode(password), "ADMIN"));
            }
        };
    }
}
