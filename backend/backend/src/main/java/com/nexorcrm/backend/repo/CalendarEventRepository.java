package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByUserIdOrderByStartDateAsc(Long userId);
}
