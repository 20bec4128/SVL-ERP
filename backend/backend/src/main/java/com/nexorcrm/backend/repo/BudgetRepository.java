package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByDeletedFalseOrderByIdDesc();
}
