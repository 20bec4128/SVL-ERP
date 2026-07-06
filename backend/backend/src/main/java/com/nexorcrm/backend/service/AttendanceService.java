package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.*;
import com.nexorcrm.backend.entity.*;
import com.nexorcrm.backend.repo.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AttendanceService {
    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Kolkata");

    private final AttendanceRepository attendanceRepository;
    private final AttendanceEventRepository eventRepository;
    private final AttendanceBreakRepository breakRepository;
    private final ShiftRepository shiftRepository;
    private final EmployeeShiftRepository employeeShiftRepository;
    private final CompanyLocationRepository locationRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final GeoFenceService geoFenceService;
    private final ShiftService shiftService;
    private final HolidayRepository holidayRepository;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             AttendanceEventRepository eventRepository,
                             AttendanceBreakRepository breakRepository,
                             ShiftRepository shiftRepository,
                             EmployeeShiftRepository employeeShiftRepository,
                             CompanyLocationRepository locationRepository,
                             UserRepository userRepository,
                             EmployeeRepository employeeRepository,
                             GeoFenceService geoFenceService,
                             ShiftService shiftService,
                             HolidayRepository holidayRepository) {
        this.attendanceRepository = attendanceRepository;
        this.eventRepository = eventRepository;
        this.breakRepository = breakRepository;
        this.shiftRepository = shiftRepository;
        this.employeeShiftRepository = employeeShiftRepository;
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.geoFenceService = geoFenceService;
        this.shiftService = shiftService;
        this.holidayRepository = holidayRepository;
    }

    // ══════════════════════════════════════════════════════════════
    // CHECK-IN
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public AttendanceResponse checkIn(Long userId, AttendanceCheckInRequest req) {
        LocalDateTime now = now();
        LocalDate today = now.toLocalDate();

        Attendance att = null;
        boolean lateCheckinAllowed = false;
        Optional<Attendance> existing = attendanceRepository.findByUserIdAndAttendanceDateAndDeletedFalse(userId, today);
        if (existing.isPresent()) {
            Attendance existingRecord = existing.get();
            if (existingRecord.getCheckInTime() != null) {
                AttendanceStatus st = existingRecord.getStatus();
                if (st != AttendanceStatus.CHECKED_OUT && st != AttendanceStatus.AUTO_CHECKOUT) {
                    throw new IllegalArgumentException("You have already checked in today.");
                }
                throw new IllegalArgumentException("You have already completed attendance for today.");
            }
            att = existingRecord;
            lateCheckinAllowed = Boolean.TRUE.equals(existingRecord.getLateCheckinAllowed());
        }

        // Resolve shift assignment via employee record (bridge: user.email = employee.email)
        EmployeeShift assignment = null;
        User actor = userRepository.findById(userId).orElse(null);
        if (actor != null) {
            Employee employee = null;
            if (actor.getEmployeeId() != null) {
                employee = employeeRepository.findById(actor.getEmployeeId())
                        .filter(found -> !Boolean.TRUE.equals(found.getDeleted()))
                        .orElse(null);
            }
            if (employee == null && actor.getEmail() != null) {
                employee = employeeRepository
                        .findAllByAnyEmailIgnoreCaseAndDeletedFalse(actor.getEmail())
                        .stream()
                        .findFirst()
                        .orElse(null);
            }
            if (employee != null) {
                assignment = employeeShiftRepository.findActiveForEmployee(employee.getId(), today).orElse(null);
            }
        }
        // Fallback: try legacy user_id-based lookup (for rows created before migration)
        if (assignment == null) {
            assignment = employeeShiftRepository.findActiveForUser(userId, today).orElse(null);
        }

        Shift shift = null;
        Long locationId = null;

        if (assignment != null) {
            shift = shiftRepository.findById(assignment.getShiftId()).orElse(null);
            locationId = assignment.getLocationId();
        }

        // If no shift assigned, use first active shift as default
        if (shift == null) {
            shift = shiftRepository.findByDeletedFalseAndActiveTrueOrderByNameAsc()
                    .stream().findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("No shifts configured. Contact admin."));
        }

        // Validate check-in window (skip for ADMIN / MANAGER / SUPER_ADMIN)
        boolean isPrivileged = actor != null && (
                actor.getRole() == Role.ADMIN ||
                actor.getRole() == Role.MANAGER ||
                actor.getRole() == Role.SUPER_ADMIN);
        if (!isPrivileged && !lateCheckinAllowed) {
            shiftService.validateCheckinWindow(shift, now);
        }

        // Multi-location check-in: try assigned location first, then fallback to any company location
        if (locationId != null) {
            try {
                geoFenceService.validateWithinGeofence(locationId, req.getLatitude(), req.getLongitude(), req.getAccuracy());
            } catch (IllegalArgumentException e) {
                // Assigned location geofence failed — try fallback
                final String assignedLocationError = e.getMessage();
                locationId = geoFenceService.findValidLocation(req.getLatitude(), req.getLongitude(), req.getAccuracy())
                        .map(loc -> loc.getId())
                        .orElseThrow(() -> new IllegalArgumentException(assignedLocationError != null && !assignedLocationError.isBlank()
                                ? assignedLocationError
                                : "You are not within any registered company location."));
            }
        } else {
            // No assigned location — try to find any matching company location
            locationId = geoFenceService.findValidLocation(req.getLatitude(), req.getLongitude(), req.getAccuracy())
                    .map(loc -> loc.getId())
                    .orElseThrow(() -> new IllegalArgumentException("You are not within any registered company location."));
        }

        // Calculate lateness
        int lateMinutes = shiftService.calculateLateMinutes(shift, now);

        // Create or update attendance record
        if (att == null) {
            att = new Attendance();
            att.setUserId(userId);
            att.setAttendanceDate(today);
        }
        att.setShiftId(shift.getId());
        att.setLocationId(locationId);
        att.setCheckInTime(now);
        att.setCheckInLat(req.getLatitude());
        att.setCheckInLng(req.getLongitude());
        att.setCheckInAccuracy(req.getAccuracy());
        att.setStatus(AttendanceStatus.CHECKED_IN);
        att.setIsLate(lateMinutes > 0);
        att.setLateMinutes(lateMinutes);
        att.setNotes(req.getNotes());

        att = attendanceRepository.save(att);

        // Log event
        logEvent(att.getId(), AttendanceEventType.CHECK_IN, now, req.getLatitude(), req.getLongitude(), req.getAccuracy(), req.getNotes());

        return toResponse(att);
    }

    // ══════════════════════════════════════════════════════════════
    // CHECK-OUT
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public AttendanceResponse checkOut(Long userId, AttendanceCheckOutRequest req) {
        LocalDateTime now = now();
        LocalDate today = now.toLocalDate();

        Attendance att = attendanceRepository.findByUserIdAndAttendanceDateAndDeletedFalse(userId, today)
                .orElseThrow(() -> new IllegalArgumentException("You haven't checked in today."));

        if (att.getStatus() == AttendanceStatus.CHECKED_OUT || att.getStatus() == AttendanceStatus.AUTO_CHECKOUT) {
            throw new IllegalArgumentException("You have already checked out.");
        }

        // If on break/lunch, auto-end it first
        endAllOpenBreaks(att, now);

        // Multi-location check-out: try check-in location first, then fallback to any company location
        // Note: locationId on attendance record is NEVER overwritten at checkout
        try {
            geoFenceService.validateWithinGeofence(att.getLocationId(), req.getLatitude(), req.getLongitude(), req.getAccuracy());
        } catch (IllegalArgumentException e) {
            // Check-in location geofence failed — try any company location
            final String assignedLocationError = e.getMessage();
            geoFenceService.findValidLocation(req.getLatitude(), req.getLongitude(), req.getAccuracy())
                    .orElseThrow(() -> new IllegalArgumentException(assignedLocationError != null && !assignedLocationError.isBlank()
                            ? assignedLocationError
                            : "You are not within any registered company location."));
        }

        att.setCheckOutTime(now);
        att.setCheckOutLat(req.getLatitude());
        att.setCheckOutLng(req.getLongitude());
        att.setCheckOutAccuracy(req.getAccuracy());
        att.setStatus(AttendanceStatus.CHECKED_OUT);
        if (req.getNotes() != null && !req.getNotes().isBlank()) {
            att.setNotes((att.getNotes() != null ? att.getNotes() + "; " : "") + req.getNotes());
        }

        // Calculate work time
        calculateWorkTime(att);

        att = attendanceRepository.save(att);

        logEvent(att.getId(), AttendanceEventType.CHECK_OUT, now, req.getLatitude(), req.getLongitude(), req.getAccuracy(), req.getNotes());

        return toResponse(att);
    }

    // ══════════════════════════════════════════════════════════════
    private Shift getShiftForAttendance(Attendance att) {
        if (att.getShiftId() != null) {
            return shiftRepository.findById(att.getShiftId()).orElse(null);
        }
        EmployeeShift assignment = employeeShiftRepository.findActiveForUser(att.getUserId(), att.getAttendanceDate()).orElse(null);
        if (assignment != null) {
            return shiftRepository.findById(assignment.getShiftId()).orElse(null);
        }
        return shiftRepository.findByDeletedFalseAndActiveTrueOrderByNameAsc()
                .stream().findFirst().orElse(null);
    }

    // ══════════════════════════════════════════════════════════════
    // START BREAK / LUNCH
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public AttendanceResponse startBreak(Long userId, AttendanceBreakRequest req) {
        LocalDateTime now = now();
        LocalDate today = now.toLocalDate();

        Attendance att = attendanceRepository.findByUserIdAndAttendanceDateAndDeletedFalse(userId, today)
                .orElseThrow(() -> new IllegalArgumentException("You haven't checked in today."));

        if (att.getStatus() != AttendanceStatus.CHECKED_IN) {
            throw new IllegalArgumentException("You can only start a break when checked in. Current status: " + att.getStatus());
        }

        BreakType breakType = BreakType.valueOf(req.getBreakType().toUpperCase());
        Shift shift = getShiftForAttendance(att);
        if (shift != null) {
            LocalTime nowTime = now.toLocalTime();
            if (breakType == BreakType.BREAK_1) {
                if (!isTimeWithinWindow(nowTime, shift.getBreak1StartTime(), shift.getBreak1EndTime())) {
                    throw new IllegalArgumentException("Break 1 is only allowed between " + shift.getBreak1StartTime() + " and " + shift.getBreak1EndTime());
                }
            } else if (breakType == BreakType.LUNCH) {
                if (!isTimeWithinWindow(nowTime, shift.getLunchStartTime(), shift.getLunchEndTime())) {
                    throw new IllegalArgumentException("Lunch is only allowed between " + shift.getLunchStartTime() + " and " + shift.getLunchEndTime());
                }
            } else if (breakType == BreakType.BREAK_2) {
                if (!isTimeWithinWindow(nowTime, shift.getBreak2StartTime(), shift.getBreak2EndTime())) {
                    throw new IllegalArgumentException("Break 2 is only allowed between " + shift.getBreak2StartTime() + " and " + shift.getBreak2EndTime());
                }
            }
        }

        AttendanceStatus newStatus;
        AttendanceEventType eventType;
        if (breakType == BreakType.BREAK_1) {
            newStatus = AttendanceStatus.ON_BREAK_1;
            eventType = AttendanceEventType.BREAK_1_START;
        } else if (breakType == BreakType.BREAK_2) {
            newStatus = AttendanceStatus.ON_BREAK_2;
            eventType = AttendanceEventType.BREAK_2_START;
        } else if (breakType == BreakType.LUNCH) {
            newStatus = AttendanceStatus.ON_LUNCH;
            eventType = AttendanceEventType.LUNCH_START;
        } else {
            newStatus = AttendanceStatus.ON_BREAK;
            eventType = AttendanceEventType.BREAK_START;
        }

        // Create break record
        AttendanceBreak ab = new AttendanceBreak();
        ab.setAttendanceId(att.getId());
        ab.setBreakType(breakType);
        ab.setStartTime(now);
        breakRepository.save(ab);

        att.setStatus(newStatus);
        att = attendanceRepository.save(att);

        logEvent(att.getId(), eventType, now, null, null, null, req.getNotes());

        return toResponse(att);
    }

    // ══════════════════════════════════════════════════════════════
    // END BREAK / LUNCH
    // ══════════════════════════════════════════════════════════════

    @Transactional
    public AttendanceResponse endBreak(Long userId, AttendanceBreakRequest req) {
        LocalDateTime now = now();
        LocalDate today = now.toLocalDate();

        Attendance att = attendanceRepository.findByUserIdAndAttendanceDateAndDeletedFalse(userId, today)
                .orElseThrow(() -> new IllegalArgumentException("You haven't checked in today."));

        BreakType breakType = BreakType.valueOf(req.getBreakType().toUpperCase());

        if (breakType == BreakType.BREAK_1 && att.getStatus() != AttendanceStatus.ON_BREAK_1) {
            throw new IllegalArgumentException("You are not currently on Break 1.");
        }
        if (breakType == BreakType.BREAK_2 && att.getStatus() != AttendanceStatus.ON_BREAK_2) {
            throw new IllegalArgumentException("You are not currently on Break 2.");
        }
        if (breakType == BreakType.LUNCH && att.getStatus() != AttendanceStatus.ON_LUNCH) {
            throw new IllegalArgumentException("You are not currently on lunch.");
        }
        if (breakType == BreakType.BREAK && att.getStatus() != AttendanceStatus.ON_BREAK) {
            throw new IllegalArgumentException("You are not currently on a break.");
        }

        AttendanceEventType eventType;
        if (breakType == BreakType.BREAK_1) {
            eventType = AttendanceEventType.BREAK_1_END;
        } else if (breakType == BreakType.BREAK_2) {
            eventType = AttendanceEventType.BREAK_2_END;
        } else if (breakType == BreakType.LUNCH) {
            eventType = AttendanceEventType.LUNCH_END;
        } else {
            eventType = AttendanceEventType.BREAK_END;
        }

        // Close the open break
        Optional<AttendanceBreak> openBreak = breakRepository
                .findFirstByAttendanceIdAndBreakTypeAndEndTimeIsNull(att.getId(), breakType);

        if (openBreak.isPresent()) {
            AttendanceBreak ab = openBreak.get();
            ab.setEndTime(now);
            int dur = (int) Duration.between(ab.getStartTime(), now).toMinutes();
            ab.setDurationMinutes(dur);
            breakRepository.save(ab);
        }

        att.setStatus(AttendanceStatus.CHECKED_IN);
        att = attendanceRepository.save(att);

        logEvent(att.getId(), eventType, now, null, null, null, req.getNotes());

        return toResponse(att);
    }

    // ══════════════════════════════════════════════════════════════
    // GET TODAY / HISTORY / ADMIN
    // ══════════════════════════════════════════════════════════════

    public AttendanceResponse getToday(Long userId) {
        LocalDate today = today();
        return attendanceRepository.findByUserIdAndAttendanceDateAndDeletedFalse(userId, today)
                .map(this::toResponse).orElse(null);
    }

    public List<AttendanceResponse> getHistory(Long userId, LocalDate from, LocalDate to) {
        return attendanceRepository
                .findByUserIdAndAttendanceDateBetweenAndDeletedFalseOrderByAttendanceDateDesc(userId, from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AttendanceResponse> getAdminView(LocalDate date) {
        return attendanceRepository.findByAttendanceDateAndDeletedFalseOrderByCheckInTimeDesc(date)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AttendanceResponse> getAdminRange(LocalDate from, LocalDate to) {
        return attendanceRepository
                .findByAttendanceDateBetweenAndDeletedFalseOrderByAttendanceDateDescCheckInTimeDesc(from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AttendanceSummaryResponse getSummary(Long userId) {
        LocalDate today = today();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        LocalDate monthStart = today.with(TemporalAdjusters.firstDayOfMonth());

        AttendanceSummaryResponse summary = new AttendanceSummaryResponse();

        // Today
        Attendance todayAtt = attendanceRepository.findByUserIdAndAttendanceDateAndDeletedFalse(userId, today).orElse(null);
        if (todayAtt != null) {
            int todayMins = todayAtt.getNetWorkMinutes() != null ? todayAtt.getNetWorkMinutes() : 0;
            // If still checked in, calculate live
            if (todayAtt.getStatus() == AttendanceStatus.CHECKED_IN && todayAtt.getCheckInTime() != null) {
                todayMins = (int) Duration.between(todayAtt.getCheckInTime(), now()).toMinutes()
                            - safe(todayAtt.getBreakTimeMinutes()) - safe(todayAtt.getLunchTimeMinutes());
                if (todayMins < 0) todayMins = 0;
            }
            summary.setTotalHoursToday(todayMins / 60);
            summary.setTotalMinutesToday(todayMins % 60);
        } else {
            summary.setTotalHoursToday(0);
            summary.setTotalMinutesToday(0);
        }

        // Week
        int weekMins = attendanceRepository.sumNetWorkMinutesByUserBetween(userId, weekStart, today);
        summary.setTotalHoursWeek(weekMins / 60);
        summary.setTotalMinutesWeek(weekMins % 60);

        // Month
        int monthMins = attendanceRepository.sumNetWorkMinutesByUserBetween(userId, monthStart, today);
        summary.setTotalHoursMonth(monthMins / 60);
        summary.setTotalMinutesMonth(monthMins % 60);

        // Overtime — use sum of stored overtimeMinutes from attendance records
        int overtime = attendanceRepository.sumOvertimeMinutesByUserBetween(userId, monthStart, today);
        summary.setOvertimeMinutesMonth(overtime);

        long daysThisMonth = attendanceRepository.countByUserBetween(userId, monthStart, today);
        summary.setDaysPresent((int) daysThisMonth);

        // Calculate days absent excluding weekends and holidays
        List<Holiday> holidays = holidayRepository.findByDeletedFalseOrderByDateAsc();
        Set<LocalDate> holidayDates = holidays.stream()
                .map(Holiday::getDate)
                .collect(Collectors.toSet());

        int workingDays = 0;
        for (LocalDate date = monthStart; !date.isAfter(today); date = date.plusDays(1)) {
            DayOfWeek day = date.getDayOfWeek();
            boolean isWeekend = day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
            boolean isHoliday = holidayDates.contains(date);
            if (!isWeekend && !isHoliday) {
                workingDays++;
            }
        }

        int daysAbsent = workingDays - (int) daysThisMonth;
        if (daysAbsent < 0) {
            daysAbsent = 0;
        }
        summary.setDaysAbsent(daysAbsent);

        return summary;
    }

    // ══════════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ══════════════════════════════════════════════════════════════

    private void endAllOpenBreaks(Attendance att, LocalDateTime now) {
        List<AttendanceBreak> openBreaks = breakRepository.findByAttendanceIdAndEndTimeIsNull(att.getId());
        for (AttendanceBreak ab : openBreaks) {
            ab.setEndTime(now);
            int dur = (int) Duration.between(ab.getStartTime(), now).toMinutes();
            ab.setDurationMinutes(dur);
            breakRepository.save(ab);

            AttendanceEventType endType;
            if (ab.getBreakType() == BreakType.BREAK_1) {
                endType = AttendanceEventType.BREAK_1_END;
            } else if (ab.getBreakType() == BreakType.BREAK_2) {
                endType = AttendanceEventType.BREAK_2_END;
            } else if (ab.getBreakType() == BreakType.LUNCH) {
                endType = AttendanceEventType.LUNCH_END;
            } else {
                endType = AttendanceEventType.BREAK_END;
            }
            logEvent(att.getId(), endType, now, null, null, null, "Auto-ended on checkout");
        }
    }

    void calculateWorkTime(Attendance att) {
        if (att.getCheckInTime() == null || att.getCheckOutTime() == null) return;

        long totalMinutes = Duration.between(att.getCheckInTime(), att.getCheckOutTime()).toMinutes();
        att.setTotalWorkMinutes((int) totalMinutes);

        // Sum breaks and lunch
        List<AttendanceBreak> breaks = breakRepository.findByAttendanceIdOrderByStartTimeAsc(att.getId());
        int breakMins = 0;
        int break1Mins = 0;
        int break2Mins = 0;
        int lunchMins = 0;
        for (AttendanceBreak ab : breaks) {
            if (ab.getDurationMinutes() != null) {
                if (ab.getBreakType() == BreakType.BREAK_1) {
                    break1Mins += ab.getDurationMinutes();
                } else if (ab.getBreakType() == BreakType.BREAK_2) {
                    break2Mins += ab.getDurationMinutes();
                } else if (ab.getBreakType() == BreakType.LUNCH) {
                    lunchMins += ab.getDurationMinutes();
                } else {
                    breakMins += ab.getDurationMinutes();
                }
            }
        }
        att.setBreakTimeMinutes(breakMins + break1Mins + break2Mins);
        att.setBreak1TimeMinutes(break1Mins);
        att.setBreak2TimeMinutes(break2Mins);
        att.setLunchTimeMinutes(lunchMins);

        // Calculate excess (break/lunch beyond allowed+grace)
        Shift shift = getShiftForAttendance(att);
        int breakAllowed = 15, breakGrace = 5, lunchAllowed = 60, lunchGrace = 10, minWork = 480;
        int break1Allowed = 15, break1Grace = 5;
        int break2Allowed = 15, break2Grace = 5;
        if (shift != null) {
            breakAllowed = shift.getBreakAllowedMinutes();
            breakGrace = shift.getBreakGraceMinutes();
            lunchAllowed = shift.getLunchAllowedMinutes();
            lunchGrace = shift.getLunchGraceMinutes();
            minWork = shift.getMinWorkMinutes();
            break1Allowed = shift.getBreak1AllowedMinutes() != null ? shift.getBreak1AllowedMinutes() : 15;
            break1Grace = shift.getBreak1GraceMinutes() != null ? shift.getBreak1GraceMinutes() : 5;
            break2Allowed = shift.getBreak2AllowedMinutes() != null ? shift.getBreak2AllowedMinutes() : 15;
            break2Grace = shift.getBreak2GraceMinutes() != null ? shift.getBreak2GraceMinutes() : 5;
        }

        int excessBreak1 = Math.max(0, break1Mins - (break1Allowed + break1Grace));
        int excessBreak2 = Math.max(0, break2Mins - (break2Allowed + break2Grace));
        int excessLunch = Math.max(0, lunchMins - (lunchAllowed + lunchGrace));
        int excessBreak = Math.max(0, breakMins - (breakAllowed + breakGrace)) + excessBreak1 + excessBreak2;

        att.setExcessBreakMinutes(excessBreak);
        att.setExcessBreak1Minutes(excessBreak1);
        att.setExcessBreak2Minutes(excessBreak2);
        att.setExcessLunchMinutes(excessLunch);

        // Net work = total - break - break1 - break2 - lunch
        int netWork = (int) totalMinutes - breakMins - break1Mins - break2Mins - lunchMins;
        if (netWork < 0) netWork = 0;
        att.setNetWorkMinutes(netWork);

        // Work status
        if (netWork >= minWork) {
            att.setWorkStatus(WorkStatus.COMPLETED);
        } else if (netWork >= minWork / 2) {
            att.setWorkStatus(WorkStatus.HALF_DAY);
        } else {
            att.setWorkStatus(WorkStatus.INCOMPLETE);
        }

        // ── Overtime Calculation ──
        if (shift != null) {
            LocalTime shiftEnd = shift.getEndTime();
            long rawOtMinutes = 0;

            if (Boolean.TRUE.equals(shift.getIsNightShift())) {
                // Night shift: end time is on the next day relative to check-in date
                LocalDate checkInDate = att.getCheckInTime().toLocalDate();
                LocalDateTime shiftEndDateTime;
                if (shiftEnd.isBefore(shift.getStartTime()) || shiftEnd.equals(shift.getStartTime())) {
                    // End time crosses midnight (e.g., start 22:00, end 06:00)
                    shiftEndDateTime = LocalDateTime.of(checkInDate.plusDays(1), shiftEnd);
                } else {
                    shiftEndDateTime = LocalDateTime.of(checkInDate, shiftEnd);
                }
                rawOtMinutes = Math.max(0, Duration.between(shiftEndDateTime, att.getCheckOutTime()).toMinutes());
            } else {
                // Day shift
                LocalDateTime shiftEndDateTime = LocalDateTime.of(att.getAttendanceDate(), shiftEnd);
                rawOtMinutes = Math.max(0, Duration.between(shiftEndDateTime, att.getCheckOutTime()).toMinutes());
            }

            // Apply cap
            Integer maxOt = shift.getMaxOvertimeMinutes();
            int cappedOt;
            if (maxOt == null) {
                cappedOt = (int) rawOtMinutes; // unlimited
            } else if (maxOt == 0) {
                cappedOt = 0; // OT disabled
            } else {
                cappedOt = (int) Math.min(rawOtMinutes, maxOt);
            }
            att.setOvertimeMinutes(cappedOt);
        } else {
            att.setOvertimeMinutes(0);
        }
    }

    private void logEvent(Long attendanceId, AttendanceEventType type, LocalDateTime time,
                          Double lat, Double lng, Double accuracy, String notes) {
        AttendanceEvent event = new AttendanceEvent();
        event.setAttendanceId(attendanceId);
        event.setEventType(type);
        event.setOccurredAt(time);
        event.setLatitude(lat);
        event.setLongitude(lng);
        event.setAccuracy(accuracy);
        event.setNotes(notes);
        eventRepository.save(event);
    }

    private int safe(Integer val) {
        return val != null ? val : 0;
    }

    @Transactional
    public AttendanceResponse adminUpdate(Long id, AdminUpdateAttendanceRequest req) {
        Attendance att = attendanceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Attendance record not found"));

        if (req.getCheckInTime() != null) {
            att.setCheckInTime(req.getCheckInTime());
        }
        att.setCheckOutTime(req.getCheckOutTime());
        
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            att.setStatus(AttendanceStatus.valueOf(req.getStatus().toUpperCase()));
        } else {
            if (req.getCheckOutTime() != null) {
                att.setStatus(AttendanceStatus.CHECKED_OUT);
            } else {
                att.setStatus(AttendanceStatus.CHECKED_IN);
            }
        }

        if (req.getNotes() != null) {
            att.setNotes(req.getNotes());
        }

        // Recalculate work times and overtime
        calculateWorkTime(att);

        // Also if we manually edit check-out time, clear the missed checkout flag
        if (att.getCheckOutTime() != null) {
            att.setIsMissedCheckout(false);
        }

        att = attendanceRepository.save(att);

        logEvent(att.getId(), 
                 att.getStatus() == AttendanceStatus.CHECKED_IN ? AttendanceEventType.CHECK_IN : AttendanceEventType.CHECK_OUT, 
                 now(), null, null, null, "Manually updated by admin: " + (req.getNotes() != null ? req.getNotes() : ""));

        return toResponse(att);
    }

    @Transactional
    public AttendanceResponse allowLateCheckin(Long userId, LocalDate date) {
        Attendance att = attendanceRepository.findByUserIdAndAttendanceDateAndDeletedFalse(userId, date)
                .orElseGet(() -> {
                    Attendance newAtt = new Attendance();
                    newAtt.setUserId(userId);
                    newAtt.setAttendanceDate(date);
                    return newAtt;
                });
        att.setLateCheckinAllowed(true);
        att = attendanceRepository.save(att);
        return toResponse(att);
    }

    // ══════════════════════════════════════════════════════════════
    // MAPPING
    // ══════════════════════════════════════════════════════════════


    private AttendanceResponse toResponse(Attendance att) {
        AttendanceResponse r = new AttendanceResponse();
        r.setId(att.getId());
        r.setUserId(att.getUserId());
        r.setAttendanceDate(att.getAttendanceDate());
        r.setCheckInTime(att.getCheckInTime());
        r.setCheckOutTime(att.getCheckOutTime());
        r.setStatus(att.getStatus() != null ? att.getStatus().name() : null);
        r.setWorkStatus(att.getWorkStatus() != null ? att.getWorkStatus().name() : null);
        r.setTotalWorkMinutes(att.getTotalWorkMinutes());
        r.setBreakTimeMinutes(att.getBreakTimeMinutes());
        r.setBreak1TimeMinutes(att.getBreak1TimeMinutes());
        r.setBreak2TimeMinutes(att.getBreak2TimeMinutes());
        r.setLunchTimeMinutes(att.getLunchTimeMinutes());
        r.setExcessBreakMinutes(att.getExcessBreakMinutes());
        r.setExcessBreak1Minutes(att.getExcessBreak1Minutes());
        r.setExcessBreak2Minutes(att.getExcessBreak2Minutes());
        r.setExcessLunchMinutes(att.getExcessLunchMinutes());
        r.setNetWorkMinutes(att.getNetWorkMinutes());
        r.setIsLate(att.getIsLate());
        r.setLateMinutes(att.getLateMinutes());
        r.setNotes(att.getNotes());
        r.setOvertimeMinutes(att.getOvertimeMinutes());
        r.setIsMissedCheckout(att.getIsMissedCheckout());
        r.setMissedCheckoutFlaggedAt(att.getMissedCheckoutFlaggedAt());
        r.setLateCheckinAllowed(att.getLateCheckinAllowed());

        // Resolve names
        try {
            User user = userRepository.findById(att.getUserId()).orElse(null);
            if (user != null) {
                r.setUserName(user.getFirstName() + (user.getLastName() != null ? " " + user.getLastName() : ""));
                r.setUserRole(user.getRole() != null ? user.getRole().name() : null);
            }
        } catch (Exception ignored) {}

        if (att.getShiftId() != null) {
            shiftRepository.findById(att.getShiftId()).ifPresent(s -> {
                r.setShiftName(s.getName());
                r.setShiftStartTime(s.getStartTime());
                r.setShiftEndTime(s.getEndTime());
                r.setBreak1StartTime(s.getBreak1StartTime());
                r.setBreak1EndTime(s.getBreak1EndTime());
                r.setLunchStartTime(s.getLunchStartTime());
                r.setLunchEndTime(s.getLunchEndTime());
                r.setBreak2StartTime(s.getBreak2StartTime());
                r.setBreak2EndTime(s.getBreak2EndTime());
            });
        }
        if (att.getLocationId() != null) {
            locationRepository.findById(att.getLocationId()).ifPresent(l -> r.setLocationName(l.getName()));
        }

        // Resolve check-in and check-out locations based on coordinates
        if (att.getCheckInLat() != null && att.getCheckInLng() != null) {
            try {
                geoFenceService.findClosestLocation(att.getCheckInLat(), att.getCheckInLng())
                    .ifPresent(ciLoc -> r.setCheckInLocationName(ciLoc.getName()));
            } catch (Exception ignored) {}
        }
        if (att.getCheckOutLat() != null && att.getCheckOutLng() != null) {
            try {
                geoFenceService.findClosestLocation(att.getCheckOutLat(), att.getCheckOutLng())
                    .ifPresent(coLoc -> r.setCheckOutLocationName(coLoc.getName()));
            } catch (Exception ignored) {}
        }

        // Events
        List<AttendanceEvent> events = eventRepository.findByAttendanceIdOrderByOccurredAtAsc(att.getId());
        r.setEvents(events.stream().map(this::toEventResponse).collect(Collectors.toList()));

        // Breaks
        List<AttendanceBreak> breaks = breakRepository.findByAttendanceIdOrderByStartTimeAsc(att.getId());
        r.setBreaks(breaks.stream().map(this::toBreakResponse).collect(Collectors.toList()));

        return r;
    }

    private AttendanceEventResponse toEventResponse(AttendanceEvent e) {
        AttendanceEventResponse r = new AttendanceEventResponse();
        r.setId(e.getId());
        r.setEventType(e.getEventType().name());
        r.setOccurredAt(e.getOccurredAt());
        r.setLatitude(e.getLatitude());
        r.setLongitude(e.getLongitude());
        r.setNotes(e.getNotes());
        return r;
    }

    private AttendanceBreakResponse toBreakResponse(AttendanceBreak b) {
        AttendanceBreakResponse r = new AttendanceBreakResponse();
        r.setId(b.getId());
        r.setBreakType(b.getBreakType().name());
        r.setStartTime(b.getStartTime());
        r.setEndTime(b.getEndTime());
        r.setDurationMinutes(b.getDurationMinutes());
        return r;
    }

    private boolean isTimeWithinWindow(LocalTime currentTime, LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null) {
            return false;
        }
        if (startTime.isBefore(endTime)) {
            return !currentTime.isBefore(startTime) && !currentTime.isAfter(endTime);
        } else {
            // Crosses midnight
            return !currentTime.isBefore(startTime) || !currentTime.isAfter(endTime);
        }
    }

    private LocalDateTime now() {
        return LocalDateTime.now(APP_ZONE);
    }

    private LocalDate today() {
        return LocalDate.now(APP_ZONE);
    }
}
