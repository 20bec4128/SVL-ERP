package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Leave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface LeaveRepository extends JpaRepository<Leave, Long> {
    List<Leave> findByDeletedFalseOrderByFromDateDesc();
    List<Leave> findByEmployeeIdAndDeletedFalseOrderByFromDateDesc(Long employeeId);

    @Query("select coalesce(sum(l.noOfDays), 0) from Leave l where l.deleted=false and l.employeeId=:employeeId and lower(l.leaveType)=lower(:leaveType) and l.status='APPROVED' and l.fromDate>=:start and l.toDate<=:end and (:excludeId is null or l.id <> :excludeId)")
    BigDecimal sumApprovedDays(@Param("employeeId") Long employeeId,
                               @Param("leaveType") String leaveType,
                               @Param("start") LocalDate start,
                               @Param("end") LocalDate end,
                               @Param("excludeId") Long excludeId);
}
