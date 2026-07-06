package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.ShiftRequest;
import com.nexorcrm.backend.dto.ShiftResponse;
import com.nexorcrm.backend.dto.CompanyLocationRequest;
import com.nexorcrm.backend.dto.CompanyLocationResponse;
import com.nexorcrm.backend.dto.EmployeeShiftRequest;
import com.nexorcrm.backend.dto.EmployeeShiftResponse;
import com.nexorcrm.backend.entity.CompanyLocation;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.EmployeeShift;
import com.nexorcrm.backend.entity.Shift;
import com.nexorcrm.backend.repo.CompanyLocationRepository;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.EmployeeShiftRepository;
import com.nexorcrm.backend.repo.ShiftRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShiftService {

    private final ShiftRepository shiftRepository;
    private final CompanyLocationRepository locationRepository;
    private final EmployeeShiftRepository employeeShiftRepository;
    private final EmployeeRepository employeeRepository;

    public ShiftService(ShiftRepository shiftRepository,
                        CompanyLocationRepository locationRepository,
                        EmployeeShiftRepository employeeShiftRepository,
                        EmployeeRepository employeeRepository) {
        this.shiftRepository = shiftRepository;
        this.locationRepository = locationRepository;
        this.employeeShiftRepository = employeeShiftRepository;
        this.employeeRepository = employeeRepository;
    }

    // ── Shifts ──

    public List<ShiftResponse> listShifts() {
        return shiftRepository.findByDeletedFalseOrderByNameAsc().stream()
                .map(this::toShiftResponse).collect(Collectors.toList());
    }

    public ShiftResponse createShift(ShiftRequest req) {
        Shift s = new Shift();
        applyShift(s, req);
        return toShiftResponse(shiftRepository.save(s));
    }

    public ShiftResponse updateShift(Long id, ShiftRequest req) {
        Shift s = shiftRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Shift not found"));
        applyShift(s, req);
        return toShiftResponse(shiftRepository.save(s));
    }

    public void deleteShift(Long id) {
        Shift s = shiftRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Shift not found"));
        s.setDeleted(true);
        shiftRepository.save(s);
    }

    // ── Locations ──

    public List<CompanyLocationResponse> listLocations() {
        return locationRepository.findByDeletedFalseOrderByNameAsc().stream()
                .map(this::toLocationResponse).collect(Collectors.toList());
    }

    public CompanyLocationResponse createLocation(CompanyLocationRequest req) {
        CompanyLocation loc = new CompanyLocation();
        applyLocation(loc, req);
        return toLocationResponse(locationRepository.save(loc));
    }

    public CompanyLocationResponse updateLocation(Long id, CompanyLocationRequest req) {
        CompanyLocation loc = locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location not found"));
        applyLocation(loc, req);
        return toLocationResponse(locationRepository.save(loc));
    }

    public void deleteLocation(Long id) {
        CompanyLocation loc = locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location not found"));
        loc.setDeleted(true);
        locationRepository.save(loc);
    }

    // ── Employee-Shift assignment ──

    public EmployeeShiftResponse assignShift(EmployeeShiftRequest req) {
        Employee employee = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found: " + req.getEmployeeId()));

        // Deactivate any currently-active assignment for this employee
        LocalDate from = req.getEffectiveFrom() != null ? req.getEffectiveFrom() : LocalDate.now();
        employeeShiftRepository.findActiveForEmployee(employee.getId(), from).ifPresent(old -> {
            old.setEffectiveTo(from.minusDays(1));
            employeeShiftRepository.save(old);
        });

        EmployeeShift es = new EmployeeShift();
        es.setEmployeeId(employee.getId());
        es.setShiftId(req.getShiftId());
        es.setLocationId(req.getLocationId());
        es.setEffectiveFrom(from);
        es.setEffectiveTo(req.getEffectiveTo());
        return toEmployeeShiftResponse(employeeShiftRepository.save(es));
    }

    public List<EmployeeShiftResponse> listEmployeeShiftAssignments() {
        return employeeShiftRepository.findAll().stream()
                .map(this::toEmployeeShiftResponse)
                .collect(Collectors.toList());
    }

    public List<EmployeeShiftResponse> getShiftsForEmployee(Long employeeId) {
        return employeeShiftRepository.findByEmployeeId(employeeId).stream()
                .map(this::toEmployeeShiftResponse)
                .collect(Collectors.toList());
    }

    public EmployeeShift getActiveShiftForEmployee(Long employeeId) {
        return employeeShiftRepository.findActiveForEmployee(employeeId, LocalDate.now()).orElse(null);
    }

    /** @deprecated use getActiveShiftForEmployee after resolving employeeId from user email */
    public EmployeeShift getActiveShiftAssignment(Long userId) {
        return employeeShiftRepository.findActiveForUser(userId, LocalDate.now()).orElse(null);
    }

    // ── Shift time window validation ──

    /**
     * Checks if current time is within the allowed check-in window for the shift.
     * Window: (shiftStart - earlyBuffer) to (shiftStart + lateBuffer)
     * Handles night-shift cross-midnight correctly.
     */
    public void validateCheckinWindow(Shift shift, LocalDateTime now) {
        LocalTime currentTime = now.toLocalTime();
        LocalTime shiftStart = shift.getStartTime();
        int earlyBuf = shift.getEarlyCheckinBufferMinutes();
        int lateBuf = shift.getLateCheckinBufferMinutes();

        LocalTime windowStart = shiftStart.minusMinutes(earlyBuf);
        LocalTime windowEnd = shiftStart.plusMinutes(lateBuf);

        boolean inWindow;
        if (shift.getIsNightShift()) {
            // Night shift: window may cross midnight
            // windowStart could be e.g. 21:30, windowEnd could be 22:15 (both same side)
            // or windowStart could be 23:30, windowEnd could be 00:15 (crosses midnight)
            if (windowStart.isAfter(windowEnd)) {
                // crosses midnight: valid if >= windowStart OR <= windowEnd
                inWindow = !currentTime.isBefore(windowStart) || !currentTime.isAfter(windowEnd);
            } else {
                inWindow = !currentTime.isBefore(windowStart) && !currentTime.isAfter(windowEnd);
            }
        } else {
            inWindow = !currentTime.isBefore(windowStart) && !currentTime.isAfter(windowEnd);
        }

        if (!inWindow) {
            throw new IllegalArgumentException(
                "Check-in is only allowed between " + windowStart + " and " + windowEnd
                + " for shift '" + shift.getName() + "'. Current time: " + currentTime);
        }
    }

    /**
     * Calculates how many minutes late the user checked in relative to shift start.
     */
    public int calculateLateMinutes(Shift shift, LocalDateTime checkInTime) {
        LocalTime checkInLocal = checkInTime.toLocalTime();
        LocalTime shiftStart = shift.getStartTime();

        if (checkInLocal.isAfter(shiftStart)) {
            long minutes = java.time.Duration.between(shiftStart, checkInLocal).toMinutes();
            return (int) minutes;
        }
        return 0;
    }

    // ── Mapping ──

    private void applyShift(Shift s, ShiftRequest r) {
        s.setName(r.getName());
        s.setStartTime(r.getStartTime());
        s.setEndTime(r.getEndTime());
        if (r.getEarlyCheckinBufferMinutes() != null) s.setEarlyCheckinBufferMinutes(r.getEarlyCheckinBufferMinutes());
        if (r.getLateCheckinBufferMinutes() != null) s.setLateCheckinBufferMinutes(r.getLateCheckinBufferMinutes());
        if (r.getBreakAllowedMinutes() != null) s.setBreakAllowedMinutes(r.getBreakAllowedMinutes());
        if (r.getBreakGraceMinutes() != null) s.setBreakGraceMinutes(r.getBreakGraceMinutes());
        s.setBreak1StartTime(r.getBreak1StartTime());
        s.setBreak1EndTime(r.getBreak1EndTime());
        if (r.getBreak1AllowedMinutes() != null) s.setBreak1AllowedMinutes(r.getBreak1AllowedMinutes());
        if (r.getBreak1GraceMinutes() != null) s.setBreak1GraceMinutes(r.getBreak1GraceMinutes());
        s.setLunchStartTime(r.getLunchStartTime());
        s.setLunchEndTime(r.getLunchEndTime());
        if (r.getLunchAllowedMinutes() != null) s.setLunchAllowedMinutes(r.getLunchAllowedMinutes());
        if (r.getLunchGraceMinutes() != null) s.setLunchGraceMinutes(r.getLunchGraceMinutes());
        s.setBreak2StartTime(r.getBreak2StartTime());
        s.setBreak2EndTime(r.getBreak2EndTime());
        if (r.getBreak2AllowedMinutes() != null) s.setBreak2AllowedMinutes(r.getBreak2AllowedMinutes());
        if (r.getBreak2GraceMinutes() != null) s.setBreak2GraceMinutes(r.getBreak2GraceMinutes());
        if (r.getIsNightShift() != null) s.setIsNightShift(r.getIsNightShift());
        s.setMinWorkMinutes(calculateMinWorkMinutes(r.getStartTime(), r.getEndTime()));
        if (r.getMaxOvertimeMinutes() != null) s.setMaxOvertimeMinutes(r.getMaxOvertimeMinutes());
    }

    private int calculateMinWorkMinutes(LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null) {
            return 0;
        }

        long minutes = Duration.between(startTime, endTime).toMinutes();
        if (minutes < 0) {
            minutes += 24L * 60L;
        }
        return (int) Math.max(0L, minutes);
    }

    private ShiftResponse toShiftResponse(Shift s) {
        ShiftResponse r = new ShiftResponse();
        r.setId(s.getId());
        r.setName(s.getName());
        r.setStartTime(s.getStartTime());
        r.setEndTime(s.getEndTime());
        r.setEarlyCheckinBufferMinutes(s.getEarlyCheckinBufferMinutes());
        r.setLateCheckinBufferMinutes(s.getLateCheckinBufferMinutes());
        r.setBreakAllowedMinutes(s.getBreakAllowedMinutes());
        r.setBreakGraceMinutes(s.getBreakGraceMinutes());
        r.setBreak1StartTime(s.getBreak1StartTime());
        r.setBreak1EndTime(s.getBreak1EndTime());
        r.setBreak1AllowedMinutes(s.getBreak1AllowedMinutes());
        r.setBreak1GraceMinutes(s.getBreak1GraceMinutes());
        r.setLunchStartTime(s.getLunchStartTime());
        r.setLunchEndTime(s.getLunchEndTime());
        r.setLunchAllowedMinutes(s.getLunchAllowedMinutes());
        r.setLunchGraceMinutes(s.getLunchGraceMinutes());
        r.setBreak2StartTime(s.getBreak2StartTime());
        r.setBreak2EndTime(s.getBreak2EndTime());
        r.setBreak2AllowedMinutes(s.getBreak2AllowedMinutes());
        r.setBreak2GraceMinutes(s.getBreak2GraceMinutes());
        r.setIsNightShift(s.getIsNightShift());
        r.setMinWorkMinutes(s.getMinWorkMinutes());
        r.setMaxOvertimeMinutes(s.getMaxOvertimeMinutes());
        r.setActive(s.getActive());
        return r;
    }

    private void applyLocation(CompanyLocation loc, CompanyLocationRequest r) {
        loc.setName(r.getName());
        loc.setLatitude(r.getLatitude());
        loc.setLongitude(r.getLongitude());
        if (r.getRadiusMeters() != null) loc.setRadiusMeters(r.getRadiusMeters());
    }

    private CompanyLocationResponse toLocationResponse(CompanyLocation loc) {
        CompanyLocationResponse r = new CompanyLocationResponse();
        r.setId(loc.getId());
        r.setName(loc.getName());
        r.setLatitude(loc.getLatitude());
        r.setLongitude(loc.getLongitude());
        r.setRadiusMeters(loc.getRadiusMeters());
        r.setActive(loc.getActive());
        return r;
    }

    private EmployeeShiftResponse toEmployeeShiftResponse(EmployeeShift es) {
        EmployeeShiftResponse r = new EmployeeShiftResponse();
        r.setId(es.getId());
        r.setEmployeeId(es.getEmployeeId());
        r.setShiftId(es.getShiftId());
        r.setLocationId(es.getLocationId());
        r.setEffectiveFrom(es.getEffectiveFrom());
        r.setEffectiveTo(es.getEffectiveTo());
        shiftRepository.findById(es.getShiftId()).ifPresent(s -> {
            r.setShiftName(s.getName());
            r.setShiftStartTime(s.getStartTime());
            r.setShiftEndTime(s.getEndTime());
        });
        if (es.getLocationId() != null) {
            locationRepository.findById(es.getLocationId()).ifPresent(loc -> r.setLocationName(loc.getName()));
        }
        return r;
    }
}
