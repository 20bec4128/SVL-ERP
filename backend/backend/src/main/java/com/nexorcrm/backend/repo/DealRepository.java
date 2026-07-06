package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DealRepository extends JpaRepository<Deal, Long> {
    List<Deal> findByDeletedFalseOrderByConvertedAtDesc();
    Optional<Deal> findByIdAndDeletedFalse(Long id);
    Optional<Deal> findBySourceLeadIdAndDeletedFalse(Long sourceLeadId);
    Optional<Deal> findFirstBySourceLeadIdOrderByIdDesc(Long sourceLeadId);
    List<Deal> findByDeletedFalseAndDesignAssignedToUserIdIsNotNullOrderByConvertedAtDesc();
    List<Deal> findByDeletedFalseAndProductionAssignedToUserIdIsNotNullOrderByConvertedAtDesc();
    List<Deal> findByDeletedFalseAndStatusIgnoreCaseOrderByConvertedAtDesc(String status);
}
