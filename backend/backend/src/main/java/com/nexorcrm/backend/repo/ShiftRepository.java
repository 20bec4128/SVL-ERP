package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShiftRepository extends JpaRepository<Shift, Long> {
    List<Shift> findByDeletedFalseAndActiveTrueOrderByNameAsc();
    List<Shift> findByDeletedFalseOrderByNameAsc();
}
