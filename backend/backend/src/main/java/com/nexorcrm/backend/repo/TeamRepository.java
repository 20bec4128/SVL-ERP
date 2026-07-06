package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Department;
import com.nexorcrm.backend.entity.Institution;
import com.nexorcrm.backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByInstitutionAndDepartmentAndIsDeletedFalseOrderByNameAsc(
            Institution institution, Department department);
    List<Team> findByDepartmentAndIsDeletedFalseOrderByNameAsc(Department department);
    Optional<Team> findByIdAndIsDeletedFalse(Long id);
    boolean existsByInstitutionAndDepartmentAndNameIgnoreCaseAndIsDeletedFalse(
            Institution institution, Department department, String name);
    boolean existsByDepartmentAndNameIgnoreCaseAndIsDeletedFalse(Department department, String name);
    Optional<Team> findByInstitutionAndDepartmentAndNameIgnoreCaseAndIsDeletedFalse(
            Institution institution, Department department, String name);
    Optional<Team> findFirstByDepartmentAndNameIgnoreCaseAndIsDeletedFalseOrderByIdAsc(Department department, String name);
}
