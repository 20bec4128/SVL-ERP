package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.AttendanceEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttendanceEventRepository extends JpaRepository<AttendanceEvent, Long> {
    List<AttendanceEvent> findByAttendanceIdOrderByOccurredAtAsc(Long attendanceId);
}
