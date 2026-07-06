package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.EmployeeShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EmployeeShiftRepository extends JpaRepository<EmployeeShift, Long> {

    List<EmployeeShift> findByEmployeeId(Long employeeId);

    @Query("SELECT es FROM EmployeeShift es WHERE es.employeeId = :employeeId " +
           "AND es.effectiveFrom <= :date " +
           "AND (es.effectiveTo IS NULL OR es.effectiveTo >= :date) " +
           "ORDER BY es.effectiveFrom DESC")
    Optional<EmployeeShift> findActiveForEmployee(@Param("employeeId") Long employeeId, @Param("date") LocalDate date);

    // Legacy: kept for AttendanceService backward-compat until fully migrated
    @Query("SELECT es FROM EmployeeShift es WHERE es.userId = :userId " +
           "AND es.effectiveFrom <= :date " +
           "AND (es.effectiveTo IS NULL OR es.effectiveTo >= :date) " +
           "ORDER BY es.effectiveFrom DESC")
    Optional<EmployeeShift> findActiveForUser(@Param("userId") Long userId, @Param("date") LocalDate date);
}
