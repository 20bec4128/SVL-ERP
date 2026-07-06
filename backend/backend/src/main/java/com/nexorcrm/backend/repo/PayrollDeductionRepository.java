package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.PayrollDeduction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PayrollDeductionRepository extends JpaRepository<PayrollDeduction, Long> {
    List<PayrollDeduction> findByDeletedFalseOrderByNameAsc();
}
