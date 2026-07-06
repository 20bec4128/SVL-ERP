package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    List<Holiday> findByDeletedFalseOrderByDateAsc();
}
