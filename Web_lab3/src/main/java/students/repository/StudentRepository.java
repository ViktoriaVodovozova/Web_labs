package students.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import students.entity.Student;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StudentRepository extends JpaRepository<Student, String> {
    boolean existsByIsuId(String isuId);
    boolean existsByIsuIdAndIdNot(String isuId, String id);

    @Query("""
        select s from Student s
        where (:groupName is null or s.group = :groupName)
          and (:dormitory is null or s.dormitory = :dormitory)
          and (:foreigner is null or s.isForeigner = :foreigner)
          and (:search is null or locate(lower(:search), lower(s.fullName)) > 0
              or locate(:search, s.isuId) > 0)
        """)
    Page<Student> search(@Param("groupName") String group,
        @Param("dormitory") Integer dormitory, @Param("foreigner") Boolean isForeigner,
        @Param("search") String search, Pageable pageable);
}
