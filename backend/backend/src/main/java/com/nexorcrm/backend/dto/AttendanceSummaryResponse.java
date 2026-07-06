package com.nexorcrm.backend.dto;

public class AttendanceSummaryResponse {

    private Integer totalHoursToday;
    private Integer totalMinutesToday;
    private Integer totalHoursWeek;
    private Integer totalMinutesWeek;
    private Integer totalHoursMonth;
    private Integer totalMinutesMonth;
    private Integer overtimeMinutesMonth;
    private Integer daysPresent;
    private Integer daysAbsent;
    private Integer daysLate;

    public Integer getTotalHoursToday() { return totalHoursToday; }
    public void setTotalHoursToday(Integer totalHoursToday) { this.totalHoursToday = totalHoursToday; }

    public Integer getTotalMinutesToday() { return totalMinutesToday; }
    public void setTotalMinutesToday(Integer totalMinutesToday) { this.totalMinutesToday = totalMinutesToday; }

    public Integer getTotalHoursWeek() { return totalHoursWeek; }
    public void setTotalHoursWeek(Integer totalHoursWeek) { this.totalHoursWeek = totalHoursWeek; }

    public Integer getTotalMinutesWeek() { return totalMinutesWeek; }
    public void setTotalMinutesWeek(Integer totalMinutesWeek) { this.totalMinutesWeek = totalMinutesWeek; }

    public Integer getTotalHoursMonth() { return totalHoursMonth; }
    public void setTotalHoursMonth(Integer totalHoursMonth) { this.totalHoursMonth = totalHoursMonth; }

    public Integer getTotalMinutesMonth() { return totalMinutesMonth; }
    public void setTotalMinutesMonth(Integer totalMinutesMonth) { this.totalMinutesMonth = totalMinutesMonth; }

    public Integer getOvertimeMinutesMonth() { return overtimeMinutesMonth; }
    public void setOvertimeMinutesMonth(Integer overtimeMinutesMonth) { this.overtimeMinutesMonth = overtimeMinutesMonth; }

    public Integer getDaysPresent() { return daysPresent; }
    public void setDaysPresent(Integer daysPresent) { this.daysPresent = daysPresent; }

    public Integer getDaysAbsent() { return daysAbsent; }
    public void setDaysAbsent(Integer daysAbsent) { this.daysAbsent = daysAbsent; }

    public Integer getDaysLate() { return daysLate; }
    public void setDaysLate(Integer daysLate) { this.daysLate = daysLate; }
}
