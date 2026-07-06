package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.GoalTracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalTrackingRepository extends JpaRepository<GoalTracking, Long> {
    List<GoalTracking> findByDeletedFalseOrderByIdDesc();
}
