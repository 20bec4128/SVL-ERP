package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.*;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.service.AttendanceService;
import com.nexorcrm.backend.service.ShiftService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final ShiftService shiftService;
    private final UserRepository userRepository;

    public AttendanceController(AttendanceService attendanceService,
                                ShiftService shiftService,
                                UserRepository userRepository) {
        this.attendanceService = attendanceService;
        this.shiftService = shiftService;
        this.userRepository = userRepository;
    }

    // ── Employee: punch actions ──

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<AttendanceResponse> checkIn(@Valid @RequestBody AttendanceCheckInRequest request,
                                                      Authentication auth) {
        Long userId = resolveUserId(auth);
        return ResponseEntity.ok(attendanceService.checkIn(userId, request));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<AttendanceResponse> checkOut(@Valid @RequestBody AttendanceCheckOutRequest request,
                                                       Authentication auth) {
        Long userId = resolveUserId(auth);
        return ResponseEntity.ok(attendanceService.checkOut(userId, request));
    }

    @PostMapping("/break/start")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<AttendanceResponse> startBreak(@Valid @RequestBody AttendanceBreakRequest request,
                                                          Authentication auth) {
        Long userId = resolveUserId(auth);
        return ResponseEntity.ok(attendanceService.startBreak(userId, request));
    }

    @PostMapping("/break/end")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<AttendanceResponse> endBreak(@Valid @RequestBody AttendanceBreakRequest request,
                                                        Authentication auth) {
        Long userId = resolveUserId(auth);
        return ResponseEntity.ok(attendanceService.endBreak(userId, request));
    }

    // ── Employee: read own data ──

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','EMPLOYEE')")
    public ResponseEntity<AttendanceResponse> getToday(Authentication auth) {
        Long userId = resolveUserId(auth);
        AttendanceResponse resp = attendanceService.getToday(userId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','EMPLOYEE')")
    public List<AttendanceResponse> getHistory(Authentication auth,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Long userId = resolveUserId(auth);
        return attendanceService.getHistory(userId, from, to);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','EMPLOYEE')")
    public AttendanceSummaryResponse getSummary(Authentication auth) {
        Long userId = resolveUserId(auth);
        return attendanceService.getSummary(userId);
    }

    // ── Admin / Manager: view all ──

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public List<AttendanceResponse> getAdminView(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return attendanceService.getAdminView(date);
    }

    @GetMapping("/admin/range")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public List<AttendanceResponse> getAdminRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return attendanceService.getAdminRange(from, to);
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<AttendanceResponse> adminUpdateAttendance(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateAttendanceRequest request) {
        return ResponseEntity.ok(attendanceService.adminUpdate(id, request));
    }

    @PostMapping("/admin/allow-late-checkin")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<AttendanceResponse> allowLateCheckin(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceService.allowLateCheckin(userId, date));
    }

    // ── Admin: shifts CRUD ──

    @GetMapping("/shifts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public List<ShiftResponse> listShifts() {
        return shiftService.listShifts();
    }

    @PostMapping("/shifts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ShiftResponse createShift(@Valid @RequestBody ShiftRequest request) {
        return shiftService.createShift(request);
    }

    @PutMapping("/shifts/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ShiftResponse updateShift(@PathVariable Long id, @Valid @RequestBody ShiftRequest request) {
        return shiftService.updateShift(id, request);
    }

    @DeleteMapping("/shifts/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public void deleteShift(@PathVariable Long id) {
        shiftService.deleteShift(id);
    }

    // ── Admin: locations CRUD ──

    @GetMapping("/locations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public List<CompanyLocationResponse> listLocations() {
        return shiftService.listLocations();
    }

    @PostMapping("/locations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public CompanyLocationResponse createLocation(@Valid @RequestBody CompanyLocationRequest request) {
        return shiftService.createLocation(request);
    }

    @PutMapping("/locations/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public CompanyLocationResponse updateLocation(@PathVariable Long id, @Valid @RequestBody CompanyLocationRequest request) {
        return shiftService.updateLocation(id, request);
    }

    @DeleteMapping("/locations/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public void deleteLocation(@PathVariable Long id) {
        shiftService.deleteLocation(id);
    }

    // ── Admin: employee-shift assignment ──

    @PostMapping("/assign-shift")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public ResponseEntity<EmployeeShiftResponse> assignShift(@Valid @RequestBody EmployeeShiftRequest request) {
        return ResponseEntity.ok(shiftService.assignShift(request));
    }

    @GetMapping("/employee-shifts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public List<EmployeeShiftResponse> listEmployeeShiftAssignments() {
        return shiftService.listEmployeeShiftAssignments();
    }

    @GetMapping("/employee-shifts/by-employee/{employeeId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public List<EmployeeShiftResponse> getEmployeeShifts(@PathVariable Long employeeId) {
        return shiftService.getShiftsForEmployee(employeeId);
    }

    // ── Helper ──

    private Long resolveUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        User user = userRepository.findByEmailAndIsDeletedFalse(auth.getName().trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getId();
    }
}
