package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.PayrollOvertime;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PayrollOvertimeRepository extends JpaRepository<PayrollOvertime, Long> {
    List<PayrollOvertime> findByDeletedFalseOrderByNameAsc();
}
