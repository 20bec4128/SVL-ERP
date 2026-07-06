package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.AuditLogResponse;
import com.nexorcrm.backend.dto.AttendanceResponse;
import com.nexorcrm.backend.dto.AttendanceSummaryResponse;
import com.nexorcrm.backend.dto.DashboardBreadcrumbResponse;
import com.nexorcrm.backend.dto.DashboardHeaderResponse;
import com.nexorcrm.backend.dto.DashboardStatResponse;
import com.nexorcrm.backend.dto.EmployeeDashboardHolidayResponse;
import com.nexorcrm.backend.dto.EmployeeDashboardPerformanceResponse;
import com.nexorcrm.backend.dto.EmployeeDashboardResponse;
import com.nexorcrm.backend.dto.EmployeeLeaveSummaryResponse;
import com.nexorcrm.backend.dto.LeaveEligibilityResponse;
import com.nexorcrm.backend.dto.LeaveResponse;
import com.nexorcrm.backend.dto.MyProfileResponse;
import com.nexorcrm.backend.entity.Holiday;
import com.nexorcrm.backend.entity.Leave;
import com.nexorcrm.backend.entity.PerformanceAppraisal;
import com.nexorcrm.backend.repo.HolidayRepository;
import com.nexorcrm.backend.repo.LeaveRepository;
import com.nexorcrm.backend.repo.PerformanceAppraisalRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class EmployeeDashboardService {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Kolkata");

    private final AuthService authService;
    private final AttendanceService attendanceService;
    private final LeaveRepository leaveRepository;
    private final LeaveSettingsService leaveSettingsService;
    private final HolidayRepository holidayRepository;
    private final PerformanceAppraisalRepository performanceAppraisalRepository;
    private final SuperAdminService superAdminService;

    public EmployeeDashboardService(AuthService authService,
                                    AttendanceService attendanceService,
                                    LeaveRepository leaveRepository,
                                    LeaveSettingsService leaveSettingsService,
                                    HolidayRepository holidayRepository,
                                    PerformanceAppraisalRepository performanceAppraisalRepository,
                                    SuperAdminService superAdminService) {
        this.authService = authService;
        this.attendanceService = attendanceService;
        this.leaveRepository = leaveRepository;
        this.leaveSettingsService = leaveSettingsService;
        this.holidayRepository = holidayRepository;
        this.performanceAppraisalRepository = performanceAppraisalRepository;
        this.superAdminService = superAdminService;
    }

    public EmployeeDashboardResponse getDashboard(String actorPrincipal) {
        MyProfileResponse profile = authService.getMyProfile(actorPrincipal);
        AttendanceSummaryResponse attendanceSummary = attendanceService.getSummary(profile.getId());
        AttendanceResponse todayAttendance = attendanceService.getToday(profile.getId());
        List<Leave> leaves = loadLeaves(profile.getEmployeeId());
        EmployeeLeaveSummaryResponse leaveSummary = buildLeaveSummary(leaves);
        LeaveEligibilityResponse leavePolicySummary = buildLeavePolicySummary(profile.getEmployeeId());
        EmployeeDashboardPerformanceResponse performanceSummary = buildPerformanceSummary(profile.getEmployeeId());
        EmployeeDashboardHolidayResponse nextHoliday = buildNextHoliday();
        List<LeaveResponse> recentLeaves = leaves.stream()
                .limit(5)
                .map(this::toLeaveResponse)
                .toList();
        List<AuditLogResponse> recentActivities = superAdminService
                .getAuditLogsForActor(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")), actorPrincipal)
                .getContent();

        EmployeeDashboardResponse response = new EmployeeDashboardResponse();
        response.setHeader(buildHeader());
        response.setProfile(profile);
        response.setAttendanceSummary(attendanceSummary);
        response.setTodayAttendance(todayAttendance);
        response.setLeaveSummary(leaveSummary);
        response.setLeavePolicySummary(leavePolicySummary);
        response.setPerformanceSummary(performanceSummary);
        response.setNextHoliday(nextHoliday);
        response.setQuickStats(buildQuickStats(attendanceSummary, leaveSummary, recentLeaves.size()));
        response.setRecentLeaves(recentLeaves);
        response.setRecentActivities(recentActivities);
        response.setStatusMessage(buildStatusMessage(todayAttendance, leaveSummary));
        return response;
    }

    private DashboardHeaderResponse buildHeader() {
        DashboardHeaderResponse header = new DashboardHeaderResponse();
        header.setTitle("Employee Dashboard");

        List<DashboardBreadcrumbResponse> breadcrumbs = new ArrayList<>();
        breadcrumbs.add(breadcrumb("/employee-dashboard", "ti ti-smart-home", "Home"));
        breadcrumbs.add(breadcrumb(null, null, "Dashboard"));
        breadcrumbs.add(breadcrumb(null, null, "Employee Dashboard"));
        header.setBreadcrumbs(breadcrumbs);
        return header;
    }

    private DashboardBreadcrumbResponse breadcrumb(String href, String iconClass, String label) {
        DashboardBreadcrumbResponse breadcrumb = new DashboardBreadcrumbResponse();
        breadcrumb.setHref(href);
        breadcrumb.setIconClass(iconClass);
        breadcrumb.setLabel(label);
        return breadcrumb;
    }

    private List<Leave> loadLeaves(Long employeeId) {
        if (employeeId == null) {
            return List.of();
        }
        return leaveRepository.findByEmployeeIdAndDeletedFalseOrderByFromDateDesc(employeeId);
    }

    private EmployeeLeaveSummaryResponse buildLeaveSummary(List<Leave> leaves) {
        LocalDate now = LocalDate.now(APP_ZONE);
        int currentYear = now.getYear();

        List<Leave> thisYear = leaves.stream()
                .filter(leave -> leave.getFromDate() != null && leave.getFromDate().getYear() == currentYear)
                .toList();

        EmployeeLeaveSummaryResponse summary = new EmployeeLeaveSummaryResponse();
        summary.setTotalRequests(thisYear.size());
        summary.setApprovedRequests((int) thisYear.stream().filter(leave -> "APPROVED".equalsIgnoreCase(leave.getStatus())).count());
        summary.setPendingRequests((int) thisYear.stream().filter(leave -> "NEW".equalsIgnoreCase(leave.getStatus())).count());
        summary.setDeclinedRequests((int) thisYear.stream().filter(leave -> "DECLINED".equalsIgnoreCase(leave.getStatus())).count());
        summary.setTotalDaysRequested(thisYear.stream()
                .map(leave -> leave.getNoOfDays() == null ? BigDecimal.ZERO : leave.getNoOfDays())
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        summary.setLatestStatus(thisYear.isEmpty() ? null : thisYear.get(0).getStatus());
        return summary;
    }

    private LeaveEligibilityResponse buildLeavePolicySummary(Long employeeId) {
        if (employeeId == null) {
            return null;
        }
        List<LeaveEligibilityResponse> eligiblePolicies = leaveSettingsService.getEligibility(employeeId);
        return eligiblePolicies.isEmpty() ? null : eligiblePolicies.get(0);
    }

    private EmployeeDashboardPerformanceResponse buildPerformanceSummary(Long employeeId) {
        EmployeeDashboardPerformanceResponse response = new EmployeeDashboardPerformanceResponse();
        if (employeeId == null) {
            response.setCompletionPercent(0);
            response.setSummary("No appraisal available yet.");
            return response;
        }

        Optional<PerformanceAppraisal> latest = performanceAppraisalRepository
                .findByEmployeeIdAndDeletedFalseOrderByCreatedAtDesc(employeeId)
                .stream()
                .findFirst();

        if (latest.isEmpty()) {
            response.setCompletionPercent(0);
            response.setSummary("No appraisal available yet.");
            return response;
        }

        PerformanceAppraisal appraisal = latest.get();
        List<com.nexorcrm.backend.dto.PerformanceAppraisalCompetency> technical = parseCompetencies(appraisal.getTechnicalJson());
        List<com.nexorcrm.backend.dto.PerformanceAppraisalCompetency> organizational = parseCompetencies(appraisal.getOrganizationalJson());
        int totalCompetencies = technical.size() + organizational.size();
        int answeredCompetencies = countAnswered(technical) + countAnswered(organizational);
        int percent = totalCompetencies == 0 ? 0 : (int) Math.round((answeredCompetencies * 100.0d) / totalCompetencies);

        response.setAppraisalId(appraisal.getId());
        response.setStatus(appraisal.getStatus());
        response.setReviewDate(appraisal.getAppraisalDate());
        response.setTechnicalCompetencies(technical.size());
        response.setOrganizationalCompetencies(organizational.size());
        response.setCompletionPercent(Math.max(0, Math.min(100, percent)));
        response.setSummary(buildPerformanceSummaryText(appraisal, totalCompetencies, answeredCompetencies));
        return response;
    }

    private EmployeeDashboardHolidayResponse buildNextHoliday() {
        LocalDate today = LocalDate.now(APP_ZONE);
        return holidayRepository.findByDeletedFalseOrderByDateAsc().stream()
                .filter(holiday -> holiday.getDate() != null && !holiday.getDate().isBefore(today))
                .findFirst()
                .map(holiday -> toHolidayResponse(holiday, today))
                .orElseGet(() -> {
                    List<Holiday> all = holidayRepository.findByDeletedFalseOrderByDateAsc();
                    if (all.isEmpty()) {
                        return null;
                    }
                    return toHolidayResponse(all.get(0), today);
                });
    }

    private EmployeeDashboardHolidayResponse toHolidayResponse(Holiday holiday, LocalDate today) {
        EmployeeDashboardHolidayResponse response = new EmployeeDashboardHolidayResponse();
        response.setId(holiday.getId());
        response.setTitle(holiday.getTitle());
        response.setDate(holiday.getDate());
        response.setDescription(holiday.getDescription());
        if (holiday.getDate() != null) {
            response.setDaysAway((int) java.time.temporal.ChronoUnit.DAYS.between(today, holiday.getDate()));
        }
        return response;
    }

    private List<com.nexorcrm.backend.dto.PerformanceAppraisalCompetency> parseCompetencies(String json) {
        try {
            if (!StringUtils.hasText(json)) {
                return List.of();
            }
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                    json,
                    new com.fasterxml.jackson.core.type.TypeReference<List<com.nexorcrm.backend.dto.PerformanceAppraisalCompetency>>() {}
            );
        } catch (Exception ex) {
            return List.of();
        }
    }

    private int countAnswered(List<com.nexorcrm.backend.dto.PerformanceAppraisalCompetency> competencies) {
        return (int) competencies.stream()
                .filter(item -> StringUtils.hasText(item.getSetValue()))
                .count();
    }

    private String buildPerformanceSummaryText(PerformanceAppraisal appraisal, int totalCompetencies, int answeredCompetencies) {
        String reviewDate = appraisal.getAppraisalDate() != null ? appraisal.getAppraisalDate().toString() : "unknown date";
        return "Latest appraisal on " + reviewDate + " with " + answeredCompetencies + " of " + totalCompetencies + " competencies completed.";
    }

    private List<DashboardStatResponse> buildQuickStats(AttendanceSummaryResponse attendanceSummary,
                                                        EmployeeLeaveSummaryResponse leaveSummary,
                                                        int recentLeaveCount) {
        List<DashboardStatResponse> stats = new ArrayList<>();
        stats.add(stat(1L, "bg-primary", "ti ti-clock", "Today Hours", formatHoursMinutes(attendanceSummary.getTotalHoursToday(), attendanceSummary.getTotalMinutesToday()), "Today"));
        stats.add(stat(2L, "bg-info", "ti ti-calendar-time", "This Week", formatHoursMinutes(attendanceSummary.getTotalHoursWeek(), attendanceSummary.getTotalMinutesWeek()), "Work hours"));
        stats.add(stat(3L, "bg-success", "ti ti-calendar-stats", "This Month", formatHoursMinutes(attendanceSummary.getTotalHoursMonth(), attendanceSummary.getTotalMinutesMonth()), "Work hours"));
        stats.add(stat(4L, "bg-warning", "ti ti-briefcase", "Overtime", formatMinutes(attendanceSummary.getOvertimeMinutesMonth()), "This month"));
        stats.add(stat(5L, "bg-secondary", "ti ti-calendar-heart", "Leave Requests", leaveSummary.getTotalRequests() == null ? "0" : String.valueOf(leaveSummary.getTotalRequests()), "This year"));
        stats.add(stat(6L, "bg-danger", "ti ti-flag-3", "Late Days", attendanceSummary.getDaysLate() == null ? "0" : String.valueOf(attendanceSummary.getDaysLate()), "This month"));
        stats.add(stat(7L, "bg-dark", "ti ti-file-text", "Recent Leaves", String.valueOf(recentLeaveCount), "Latest 5"));
        stats.add(stat(8L, "bg-success", "ti ti-progress-check", "Days Present", attendanceSummary.getDaysPresent() == null ? "0" : String.valueOf(attendanceSummary.getDaysPresent()), "This month"));
        return stats;
    }

    private DashboardStatResponse stat(Long id, String iconBg, String icon, String title, String value, String trend) {
        DashboardStatResponse response = new DashboardStatResponse();
        response.setId(id);
        response.setIconBg(iconBg);
        response.setIcon(icon);
        response.setTitle(title);
        response.setValue(value);
        response.setTrend(trend);
        response.setTrendClass("text-muted");
        response.setTrendIcon("ti ti-point-filled");
        return response;
    }

    private String buildStatusMessage(AttendanceResponse todayAttendance, EmployeeLeaveSummaryResponse leaveSummary) {
        if (todayAttendance != null) {
            if (todayAttendance.getCheckInTime() != null && todayAttendance.getCheckOutTime() == null) {
                return "You checked in today at " + formatDateTime(todayAttendance.getCheckInTime()) + ".";
            }
            if (todayAttendance.getCheckOutTime() != null) {
                return "You completed attendance today at " + formatDateTime(todayAttendance.getCheckOutTime()) + ".";
            }
        }
        if (leaveSummary != null && leaveSummary.getPendingRequests() != null && leaveSummary.getPendingRequests() > 0) {
            return "You have " + leaveSummary.getPendingRequests() + " pending leave request(s).";
        }
        return "No attendance activity has been recorded for today yet.";
    }

    private LeaveResponse toLeaveResponse(Leave leave) {
        LeaveResponse response = new LeaveResponse();
        response.setId(leave.getId());
        response.setEmployeeId(leave.getEmployeeId());
        response.setEmployeeName(leave.getEmployeeName());
        response.setDepartment(leave.getDepartment());
        response.setPolicyName(leave.getLeaveType());
        response.setFromDate(leave.getFromDate());
        response.setToDate(leave.getToDate());
        response.setNoOfDays(leave.getNoOfDays());
        response.setStatus(leave.getStatus());
        response.setReason(leave.getReason());
        return response;
    }

    private String formatHoursMinutes(Integer hours, Integer minutes) {
        int safeHours = hours == null ? 0 : hours;
        int safeMinutes = minutes == null ? 0 : minutes;
        return safeHours + "h " + String.format("%02d", safeMinutes) + "m";
    }

    private String formatMinutes(Integer minutes) {
        int safeMinutes = minutes == null ? 0 : minutes;
        int hours = safeMinutes / 60;
        int mins = safeMinutes % 60;
        return hours + "h " + String.format("%02d", mins) + "m";
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "-";
        }
        return dateTime.toLocalTime().withSecond(0).withNano(0).toString();
    }
}
