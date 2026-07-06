package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {
    List<Employee> findByDeletedFalseOrderByIdDesc();
    Employee findFirstByNameIgnoreCaseAndDeletedFalse(String name);
    Optional<Employee> findFirstByEmailIgnoreCaseAndDeletedFalse(String email);

    @Query("""
        SELECT e FROM Employee e
        WHERE e.deleted = false
          AND (
            lower(coalesce(e.email, '')) = lower(:email)
            OR lower(coalesce(e.officialEmail, '')) = lower(:email)
            OR lower(coalesce(e.personalEmail, '')) = lower(:email)
          )
        ORDER BY e.id DESC
        """)
    List<Employee> findAllByAnyEmailIgnoreCaseAndDeletedFalse(@Param("email") String email);
}
