package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserGroupRepository extends JpaRepository<UserGroup, Long> {
    List<UserGroup> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndInstitutionNameIgnoreCase(String name, String institutionName);

    boolean existsByNameIgnoreCaseAndInstitutionNameIgnoreCaseAndIdNot(String name, String institutionName, Long id);

    List<UserGroup> findByInstitutionNameIgnoreCaseAndDepartmentNameIgnoreCaseOrderByNameAsc(
            String institutionName,
            String departmentName
    );

    List<UserGroup> findByInstitutionNameIgnoreCaseOrderByNameAsc(String institutionName);

    java.util.Optional<UserGroup> findByNameIgnoreCase(String name);
}
