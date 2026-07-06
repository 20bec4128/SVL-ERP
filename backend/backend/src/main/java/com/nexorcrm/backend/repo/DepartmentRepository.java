package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Department;
import com.nexorcrm.backend.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByInstitutionAndIsDeletedFalseOrderByNameAsc(Institution institution);
    Optional<Department> findByIdAndIsDeletedFalse(Long id);
    boolean existsByInstitutionAndNameIgnoreCaseAndIsDeletedFalse(Institution institution, String name);
    Optional<Department> findFirstByInstitutionAndNameIgnoreCaseAndIsDeletedFalseOrderByIdAsc(Institution institution, String name);
}
