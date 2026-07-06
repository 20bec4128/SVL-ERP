package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.entity.CalendarEvent;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.CalendarEventRepository;
import com.nexorcrm.backend.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/calendar/events")
public class CalendarController {

    private final CalendarEventRepository calendarEventRepository;
    private final UserRepository userRepository;

    public CalendarController(CalendarEventRepository calendarEventRepository, UserRepository userRepository) {
        this.calendarEventRepository = calendarEventRepository;
        this.userRepository = userRepository;
    }

    private User getActor(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String principal = authentication.getName();
        return principal.contains("@")
                ? userRepository.findByEmailAndIsDeletedFalse(principal.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED))
                : userRepository.findByUsernameAndIsDeletedFalse(principal.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @GetMapping
    public List<CalendarEvent> list(Authentication authentication) {
        User actor = getActor(authentication);
        return calendarEventRepository.findByUserIdOrderByStartDateAsc(actor.getId());
    }

    @PostMapping
    public CalendarEvent create(@RequestBody CalendarEvent request, Authentication authentication) {
        User actor = getActor(authentication);
        CalendarEvent event = new CalendarEvent();
        event.setTitle(request.getTitle());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setAllDay(request.getAllDay() != null && request.getAllDay());
        event.setEventClassName(request.getEventClassName());
        event.setUserId(actor.getId());
        return calendarEventRepository.save(event);
    }

    @PutMapping("/{id}")
    public CalendarEvent update(@PathVariable("id") Long id, @RequestBody CalendarEvent request, Authentication authentication) {
        User actor = getActor(authentication);
        CalendarEvent event = calendarEventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (!event.getUserId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (request.getTitle() != null) event.setTitle(request.getTitle());
        if (request.getStartDate() != null) event.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) event.setEndDate(request.getEndDate());
        if (request.getAllDay() != null) event.setAllDay(request.getAllDay());
        if (request.getEventClassName() != null) event.setEventClassName(request.getEventClassName());
        return calendarEventRepository.save(event);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Long id, Authentication authentication) {
        User actor = getActor(authentication);
        CalendarEvent event = calendarEventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        if (!event.getUserId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        calendarEventRepository.delete(event);
    }
}
