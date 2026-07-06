package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.PerformanceIndicator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PerformanceIndicatorRepository extends JpaRepository<PerformanceIndicator, Long> {
    List<PerformanceIndicator> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<PerformanceIndicator> findByIdAndDeletedFalse(Long id);
}
