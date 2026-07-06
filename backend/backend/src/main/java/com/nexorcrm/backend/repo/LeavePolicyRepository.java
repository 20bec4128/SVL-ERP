package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.LeavePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LeavePolicyRepository extends JpaRepository<LeavePolicy, Long> {

    @Query("select p from LeavePolicy p join p.employees e where p.deleted=false and p.leaveType is not null and lower(p.leaveType.name)=lower(:leaveType) and e.employeeId=:employeeId")
    Optional<LeavePolicy> findPolicyForEmployee(@Param("employeeId") Long employeeId, @Param("leaveType") String leaveType);

    @Query("select p from LeavePolicy p join p.employees e where p.deleted=false and lower(p.name)=lower(:policyName) and e.employeeId=:employeeId")
    Optional<LeavePolicy> findPolicyForEmployeeByName(@Param("employeeId") Long employeeId, @Param("policyName") String policyName);

    @Query("select p from LeavePolicy p join p.employees e where p.deleted=false and e.employeeId=:employeeId")
    List<LeavePolicy> findPoliciesForEmployee(@Param("employeeId") Long employeeId);

    List<LeavePolicy> findByDeletedFalseAndLeaveType_IdOrderByNameAsc(Long leaveTypeId);

    List<LeavePolicy> findByDeletedFalseOrderByNameAsc();
}
