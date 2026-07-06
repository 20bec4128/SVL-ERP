package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Timesheet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {
    List<Timesheet> findByDeletedFalseOrderByIdDesc();
}
