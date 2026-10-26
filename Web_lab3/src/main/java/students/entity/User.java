package students.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "app_users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;
    @Column(nullable = false, unique = true, length = 50)
    public String username;
    @Column(nullable = false, unique = true, length = 254)
    public String email;
    @Column(name = "password_hash", nullable = false, length = 60)
    public String passwordHash;
    @Column(nullable = false, length = 10)
    public String role;
    public User() {}

    public User(String username, String email, String passwordHash, String role) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
    }
}
