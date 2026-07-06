package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.ProvidentFund;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProvidentFundRepository extends JpaRepository<ProvidentFund, Long> {
    List<ProvidentFund> findByDeletedFalseOrderByIdDesc();
    Optional<ProvidentFund> findByEmployeeIdAndDeletedFalse(Long employeeId);
}
