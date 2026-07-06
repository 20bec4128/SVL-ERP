package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.BranchWorkflowConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BranchWorkflowConfigRepository extends JpaRepository<BranchWorkflowConfig, Long> {
    Optional<BranchWorkflowConfig> findByBranchId(Long branchId);
}
