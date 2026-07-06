package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.SalesExpense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalesExpenseRepository extends JpaRepository<SalesExpense, Long> {
    List<SalesExpense> findByDeletedFalseOrderByIdDesc();
}
