package com.nexorcrm.backend.service;

import com.nexorcrm.backend.entity.*;
import com.nexorcrm.backend.repo.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class AutoCheckoutScheduler {

    private final AttendanceRepository attendanceRepository;
    private final ShiftRepository shiftRepository;
    private final AttendanceBreakRepository breakRepository;
    private final AttendanceEventRepository eventRepository;
    private final AttendanceService attendanceService;

    public AutoCheckoutScheduler(AttendanceRepository attendanceRepository,
                                 ShiftRepository shiftRepository,
                                 AttendanceBreakRepository breakRepository,
                                 AttendanceEventRepository eventRepository,
                                 AttendanceService attendanceService) {
        this.attendanceRepository = attendanceRepository;
        this.shiftRepository = shiftRepository;
        this.breakRepository = breakRepository;
        this.eventRepository = eventRepository;
        this.attendanceService = attendanceService;
    }

    @Scheduled(fixedDelay = 300000) // every 5 minutes
    @Transactional
    public void flagMissedCheckouts() {
        LocalDate today = LocalDate.now();
        List<AttendanceStatus> activeStatuses = List.of(
                AttendanceStatus.CHECKED_IN,
                AttendanceStatus.ON_BREAK,
                AttendanceStatus.ON_LUNCH
        );

        List<Attendance> activeAttendances = new ArrayList<>();
        activeAttendances.addAll(attendanceRepository.findByStatusInAndDeletedFalseAndAttendanceDate(activeStatuses, today));
        activeAttendances.addAll(attendanceRepository.findByStatusInAndDeletedFalseAndAttendanceDate(activeStatuses, today.minusDays(1)));

        LocalDateTime now = LocalDateTime.now();

        for (Attendance att : activeAttendances) {
            if (att.getShiftId() == null) continue;
            Shift shift = shiftRepository.findById(att.getShiftId()).orElse(null);
            if (shift == null) continue;

            LocalDateTime shiftEndDateTime = getShiftEndDateTime(att, shift);

            if (now.isAfter(shiftEndDateTime) && !Boolean.TRUE.equals(att.getIsMissedCheckout())) {
                att.setIsMissedCheckout(true);
                att.setMissedCheckoutFlaggedAt(now);
                attendanceRepository.save(att);
                logEvent(att.getId(), AttendanceEventType.CHECK_OUT, now, "Missed checkout flagged at shift end");
            }
        }
    }

    @Scheduled(fixedDelay = 300000) // every 5 minutes
    @Transactional
    public void autoCheckoutMissed() {
        LocalDate today = LocalDate.now();
        List<AttendanceStatus> checkoutStatuses = List.of(
                AttendanceStatus.CHECKED_OUT,
                AttendanceStatus.AUTO_CHECKOUT
        );

        List<Attendance> flaggedAttendances = new ArrayList<>();
        flaggedAttendances.addAll(attendanceRepository.findByIsMissedCheckoutTrueAndStatusNotInAndDeletedFalseAndAttendanceDate(checkoutStatuses, today));
        flaggedAttendances.addAll(attendanceRepository.findByIsMissedCheckoutTrueAndStatusNotInAndDeletedFalseAndAttendanceDate(checkoutStatuses, today.minusDays(1)));

        LocalDateTime now = LocalDateTime.now();

        for (Attendance att : flaggedAttendances) {
            if (att.getShiftId() == null) continue;
            Shift shift = shiftRepository.findById(att.getShiftId()).orElse(null);
            if (shift == null) continue;

            LocalDateTime shiftEndDateTime = getShiftEndDateTime(att, shift);

            if (now.isAfter(shiftEndDateTime.plusHours(2))) {
                // End all open breaks at shiftEndDateTime
                List<AttendanceBreak> openBreaks = breakRepository.findByAttendanceIdAndEndTimeIsNull(att.getId());
                for (AttendanceBreak ab : openBreaks) {
                    ab.setEndTime(shiftEndDateTime);
                    long duration = Duration.between(ab.getStartTime(), shiftEndDateTime).toMinutes();
                    ab.setDurationMinutes((int) Math.max(0, duration));
                    breakRepository.save(ab);

                    AttendanceEventType endType = ab.getBreakType() == BreakType.LUNCH
                            ? AttendanceEventType.LUNCH_END : AttendanceEventType.BREAK_END;
                    logEvent(att.getId(), endType, shiftEndDateTime, "Auto-ended open break/lunch on auto-checkout");
                }

                // Auto checkout
                att.setCheckOutTime(shiftEndDateTime);
                att.setStatus(AttendanceStatus.AUTO_CHECKOUT);
                att.setOvertimeMinutes(0);
                String note = "Auto checked-out: no checkout recorded";
                att.setNotes((att.getNotes() != null && !att.getNotes().isBlank() ? att.getNotes() + "; " : "") + note);

                attendanceService.calculateWorkTime(att);
                attendanceRepository.save(att);

                logEvent(att.getId(), AttendanceEventType.CHECK_OUT, shiftEndDateTime, note);
            }
        }
    }

    private LocalDateTime getShiftEndDateTime(Attendance att, Shift shift) {
        LocalTime shiftEnd = shift.getEndTime();
        if (Boolean.TRUE.equals(shift.getIsNightShift())) {
            LocalDate checkInDate = att.getCheckInTime() != null 
                    ? att.getCheckInTime().toLocalDate() 
                    : att.getAttendanceDate();
            if (shiftEnd.isBefore(shift.getStartTime()) || shiftEnd.equals(shift.getStartTime())) {
                return LocalDateTime.of(checkInDate.plusDays(1), shiftEnd);
            } else {
                return LocalDateTime.of(checkInDate, shiftEnd);
            }
        } else {
            return LocalDateTime.of(att.getAttendanceDate(), shiftEnd);
        }
    }

    private void logEvent(Long attendanceId, AttendanceEventType type, LocalDateTime time, String notes) {
        AttendanceEvent event = new AttendanceEvent();
        event.setAttendanceId(attendanceId);
        event.setEventType(type);
        event.setOccurredAt(time);
        event.setNotes(notes);
        eventRepository.save(event);
    }
}
