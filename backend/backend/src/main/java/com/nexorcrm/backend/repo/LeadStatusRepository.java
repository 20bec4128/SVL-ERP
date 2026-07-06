package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.LeadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeadStatusRepository extends JpaRepository<LeadStatus, Long> {
    List<LeadStatus> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<LeadStatus> findByIdAndDeletedFalse(Long id);
    Optional<LeadStatus> findByStatusNameIgnoreCase(String statusName);
    boolean existsByStatusNameIgnoreCaseAndDeletedFalse(String statusName);
    boolean existsByStatusNameIgnoreCaseAndDeletedFalseAndIdNot(String statusName, Long id);
}
