package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.AttendanceBreak;
import com.nexorcrm.backend.entity.BreakType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AttendanceBreakRepository extends JpaRepository<AttendanceBreak, Long> {
    List<AttendanceBreak> findByAttendanceIdOrderByStartTimeAsc(Long attendanceId);
    Optional<AttendanceBreak> findFirstByAttendanceIdAndBreakTypeAndEndTimeIsNull(Long attendanceId, BreakType breakType);
    List<AttendanceBreak> findByAttendanceIdAndEndTimeIsNull(Long attendanceId);
}
