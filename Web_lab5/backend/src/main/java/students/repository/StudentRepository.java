package students.repository;

import students.entity.Student;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface StudentRepository extends JpaRepository<Student, String>, JpaSpecificationExecutor<Student> {
    boolean existsByIsuId(String isuId);
    boolean existsByIsuIdAndIdNot(String isuId, String id);
}
