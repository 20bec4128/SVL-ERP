package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.DesignationMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DesignationMasterRepository extends JpaRepository<DesignationMaster, Long> {
    List<DesignationMaster> findByDeletedFalseOrderByIdDesc();
    List<DesignationMaster> findByDepartmentsIdAndDeletedFalseOrderByIdDesc(Long departmentMasterId);
    boolean existsByNameIgnoreCaseAndDeletedFalse(String name);
    Optional<DesignationMaster> findByIdAndDeletedFalse(Long id);
}
