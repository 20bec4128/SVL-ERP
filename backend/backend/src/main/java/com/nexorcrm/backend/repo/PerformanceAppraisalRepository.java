package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.PerformanceAppraisal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PerformanceAppraisalRepository extends JpaRepository<PerformanceAppraisal, Long> {
    List<PerformanceAppraisal> findByDeletedFalseOrderByIdDesc();
    List<PerformanceAppraisal> findByEmployeeIdAndDeletedFalseOrderByCreatedAtDesc(Long employeeId);
}
