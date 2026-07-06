package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.EmployeeProfileFieldVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeProfileFieldVerificationRepository extends JpaRepository<EmployeeProfileFieldVerification, Long> {
    List<EmployeeProfileFieldVerification> findByEmployeeId(Long employeeId);
    Optional<EmployeeProfileFieldVerification> findFirstByEmployeeIdAndFieldKey(Long employeeId, String fieldKey);
}

