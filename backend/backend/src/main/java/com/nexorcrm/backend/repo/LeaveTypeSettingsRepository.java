package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.LeaveTypeSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LeaveTypeSettingsRepository extends JpaRepository<LeaveTypeSettings, Long> {
    Optional<LeaveTypeSettings> findByLeaveType_NameIgnoreCase(String name);
    Optional<LeaveTypeSettings> findByLeaveType_Id(Long leaveTypeId);
}
