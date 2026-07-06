package com.nexorcrm.backend.dto;

import java.util.List;

public class AdminDashboardResponse {
    private DashboardHeaderResponse header;
    private DashboardWelcomeResponse welcome;
    private List<DashboardStatResponse> topStats;
    private List<DashboardActivityResponse> recentActivities;
    private AttendanceOverviewResponse attendanceOverview;
    private List<ClockInOutItem> clockInOutList;
    private List<ClockInOutItem> lateList;
    private List<DashboardEmployeeResponse> employees;
    private List<DashboardBirthdayGroupResponse> birthdays;

    public DashboardHeaderResponse getHeader() {
        return header;
    }

    public void setHeader(DashboardHeaderResponse header) {
        this.header = header;
    }

    public DashboardWelcomeResponse getWelcome() {
        return welcome;
    }

    public void setWelcome(DashboardWelcomeResponse welcome) {
        this.welcome = welcome;
    }

    public List<DashboardStatResponse> getTopStats() {
        return topStats;
    }

    public void setTopStats(List<DashboardStatResponse> topStats) {
        this.topStats = topStats;
    }

    public List<DashboardActivityResponse> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<DashboardActivityResponse> recentActivities) {
        this.recentActivities = recentActivities;
    }

    public AttendanceOverviewResponse getAttendanceOverview() {
        return attendanceOverview;
    }

    public void setAttendanceOverview(AttendanceOverviewResponse attendanceOverview) {
        this.attendanceOverview = attendanceOverview;
    }

    public List<ClockInOutItem> getClockInOutList() {
        return clockInOutList;
    }

    public void setClockInOutList(List<ClockInOutItem> clockInOutList) {
        this.clockInOutList = clockInOutList;
    }

    public List<ClockInOutItem> getLateList() {
        return lateList;
    }

    public void setLateList(List<ClockInOutItem> lateList) {
        this.lateList = lateList;
    }

    public List<DashboardEmployeeResponse> getEmployees() {
        return employees;
    }

    public void setEmployees(List<DashboardEmployeeResponse> employees) {
        this.employees = employees;
    }

    public List<DashboardBirthdayGroupResponse> getBirthdays() {
        return birthdays;
    }

    public void setBirthdays(List<DashboardBirthdayGroupResponse> birthdays) {
        this.birthdays = birthdays;
    }
}
