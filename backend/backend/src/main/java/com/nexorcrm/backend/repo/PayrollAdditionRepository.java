package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.PayrollAddition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PayrollAdditionRepository extends JpaRepository<PayrollAddition, Long> {
    List<PayrollAddition> findByDeletedFalseOrderByNameAsc();
}
