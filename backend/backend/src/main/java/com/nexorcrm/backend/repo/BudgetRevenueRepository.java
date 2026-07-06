package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.BudgetRevenue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetRevenueRepository extends JpaRepository<BudgetRevenue, Long> {
    List<BudgetRevenue> findByDeletedFalseOrderByIdDesc();
}
