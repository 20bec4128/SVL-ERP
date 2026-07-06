package com.nexorcrm.backend.dto;

import java.util.List;

public class EmployeeDashboardResponse {
    private DashboardHeaderResponse header;
    private MyProfileResponse profile;
    private AttendanceSummaryResponse attendanceSummary;
    private AttendanceResponse todayAttendance;
    private EmployeeLeaveSummaryResponse leaveSummary;
    private EmployeeDashboardPerformanceResponse performanceSummary;
    private EmployeeDashboardHolidayResponse nextHoliday;
    private LeaveEligibilityResponse leavePolicySummary;
    private List<DashboardStatResponse> quickStats;
    private List<LeaveResponse> recentLeaves;
    private List<AuditLogResponse> recentActivities;
    private String statusMessage;

    public DashboardHeaderResponse getHeader() {
        return header;
    }

    public void setHeader(DashboardHeaderResponse header) {
        this.header = header;
    }

    public MyProfileResponse getProfile() {
        return profile;
    }

    public void setProfile(MyProfileResponse profile) {
        this.profile = profile;
    }

    public AttendanceSummaryResponse getAttendanceSummary() {
        return attendanceSummary;
    }

    public void setAttendanceSummary(AttendanceSummaryResponse attendanceSummary) {
        this.attendanceSummary = attendanceSummary;
    }

    public AttendanceResponse getTodayAttendance() {
        return todayAttendance;
    }

    public void setTodayAttendance(AttendanceResponse todayAttendance) {
        this.todayAttendance = todayAttendance;
    }

    public EmployeeLeaveSummaryResponse getLeaveSummary() {
        return leaveSummary;
    }

    public void setLeaveSummary(EmployeeLeaveSummaryResponse leaveSummary) {
        this.leaveSummary = leaveSummary;
    }

    public EmployeeDashboardPerformanceResponse getPerformanceSummary() {
        return performanceSummary;
    }

    public void setPerformanceSummary(EmployeeDashboardPerformanceResponse performanceSummary) {
        this.performanceSummary = performanceSummary;
    }

    public EmployeeDashboardHolidayResponse getNextHoliday() {
        return nextHoliday;
    }

    public void setNextHoliday(EmployeeDashboardHolidayResponse nextHoliday) {
        this.nextHoliday = nextHoliday;
    }

    public LeaveEligibilityResponse getLeavePolicySummary() {
        return leavePolicySummary;
    }

    public void setLeavePolicySummary(LeaveEligibilityResponse leavePolicySummary) {
        this.leavePolicySummary = leavePolicySummary;
    }

    public List<DashboardStatResponse> getQuickStats() {
        return quickStats;
    }

    public void setQuickStats(List<DashboardStatResponse> quickStats) {
        this.quickStats = quickStats;
    }

    public List<LeaveResponse> getRecentLeaves() {
        return recentLeaves;
    }

    public void setRecentLeaves(List<LeaveResponse> recentLeaves) {
        this.recentLeaves = recentLeaves;
    }

    public List<AuditLogResponse> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<AuditLogResponse> recentActivities) {
        this.recentActivities = recentActivities;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }
}
