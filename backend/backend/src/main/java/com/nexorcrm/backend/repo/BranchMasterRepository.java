package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.BranchMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BranchMasterRepository extends JpaRepository<BranchMaster, Long> {
    List<BranchMaster> findByDeletedFalseOrderByIdDesc();
    List<BranchMaster> findByHeadOfficeIdAndDeletedFalseOrderByIdDesc(Long headOfficeId);
    boolean existsByHeadOfficeIdAndNameIgnoreCaseAndDeletedFalse(Long headOfficeId, String name);
    Optional<BranchMaster> findByIdAndDeletedFalse(Long id);
    Optional<BranchMaster> findByHeadOfficeIdAndNameIgnoreCaseAndDeletedFalse(Long headOfficeId, String name);
    Optional<BranchMaster> findFirstByNameIgnoreCaseAndDeletedFalseOrderByIdAsc(String name);
}

