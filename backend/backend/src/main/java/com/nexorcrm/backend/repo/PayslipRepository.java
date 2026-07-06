package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PayslipRepository extends JpaRepository<Payslip, Long> {
    List<Payslip> findByDeletedFalseOrderByIdDesc();
    List<Payslip> findByMonthAndDeletedFalseOrderByIdDesc(String month);
}
