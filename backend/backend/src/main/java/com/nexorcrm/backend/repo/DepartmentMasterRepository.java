package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.DepartmentMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentMasterRepository extends JpaRepository<DepartmentMaster, Long> {
    List<DepartmentMaster> findByDeletedFalseOrderByIdDesc();
    List<DepartmentMaster> findByBranchesIdAndDeletedFalseOrderByIdDesc(Long branchId);
    boolean existsByNameIgnoreCaseAndDeletedFalse(String name);
    Optional<DepartmentMaster> findByIdAndDeletedFalse(Long id);
}
