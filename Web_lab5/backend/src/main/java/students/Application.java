package students;

import students.repository.UserRepository;
import students.entity.User;
import students.repository.StudentRepository;
import students.entity.Student;

import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    // ВОТ ЭТОТ БЛОК ГЕНЕРИРУЕТ 1000 СТУДЕНТОВ
    @Bean
    CommandLineRunner seedStudents(StudentRepository studentRepository) {
        return args -> {
            if (studentRepository.count() == 0) {
                List<Student> students = new ArrayList<>();
                for (int i = 1; i <= 1000; i++) {
                    Student s = new Student();
                    s.fullName = "Студент Тестовый " + i;
                    s.group = "P32" + String.format("%02d", (i % 10) + 1);
                    s.isuId = String.format("%06d", i); // ИСУ ID от 000001 до 001000
                    s.dormitory = (i % 10) + 1;
                    s.room = (i % 100) + 1;
                    s.moveInDate = LocalDate.of(2023, 9, 1).minusDays(i % 100);
                    s.isForeigner = i % 5 == 0;
                    s.notes = "Автоматически сгенерированный студент номер " + i;
                    students.add(s);
                }
                studentRepository.saveAll(students);
                System.out.println("✅ База данных успешно заполнена 1000 студентами!");
            } else {
                System.out.println("⚠️ В базе уже есть студенты. Генерация пропущена.");
            }
        };
    }
}