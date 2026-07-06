package com.nexorcrm.backend.dto;

import java.time.LocalTime;

public class ShiftResponse {

    private Long id;
    private String name;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer earlyCheckinBufferMinutes;
    private Integer lateCheckinBufferMinutes;
    private Integer breakAllowedMinutes;
    private Integer breakGraceMinutes;
    private LocalTime break1StartTime;
    private LocalTime break1EndTime;
    private Integer break1AllowedMinutes;
    private Integer break1GraceMinutes;
    private LocalTime lunchStartTime;
    private LocalTime lunchEndTime;
    private Integer lunchAllowedMinutes;
    private Integer lunchGraceMinutes;
    private LocalTime break2StartTime;
    private LocalTime break2EndTime;
    private Integer break2AllowedMinutes;
    private Integer break2GraceMinutes;
    private Boolean isNightShift;
    private Integer minWorkMinutes;
    private Integer maxOvertimeMinutes;
    private Boolean active;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }

    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }

    public Integer getEarlyCheckinBufferMinutes() { return earlyCheckinBufferMinutes; }
    public void setEarlyCheckinBufferMinutes(Integer earlyCheckinBufferMinutes) { this.earlyCheckinBufferMinutes = earlyCheckinBufferMinutes; }

    public Integer getLateCheckinBufferMinutes() { return lateCheckinBufferMinutes; }
    public void setLateCheckinBufferMinutes(Integer lateCheckinBufferMinutes) { this.lateCheckinBufferMinutes = lateCheckinBufferMinutes; }

    public Integer getBreakAllowedMinutes() { return breakAllowedMinutes; }
    public void setBreakAllowedMinutes(Integer breakAllowedMinutes) { this.breakAllowedMinutes = breakAllowedMinutes; }

    public Integer getBreakGraceMinutes() { return breakGraceMinutes; }
    public void setBreakGraceMinutes(Integer breakGraceMinutes) { this.breakGraceMinutes = breakGraceMinutes; }

    public LocalTime getBreak1StartTime() { return break1StartTime; }
    public void setBreak1StartTime(LocalTime break1StartTime) { this.break1StartTime = break1StartTime; }

    public LocalTime getBreak1EndTime() { return break1EndTime; }
    public void setBreak1EndTime(LocalTime break1EndTime) { this.break1EndTime = break1EndTime; }

    public Integer getBreak1AllowedMinutes() { return break1AllowedMinutes; }
    public void setBreak1AllowedMinutes(Integer break1AllowedMinutes) { this.break1AllowedMinutes = break1AllowedMinutes; }

    public Integer getBreak1GraceMinutes() { return break1GraceMinutes; }
    public void setBreak1GraceMinutes(Integer break1GraceMinutes) { this.break1GraceMinutes = break1GraceMinutes; }

    public LocalTime getLunchStartTime() { return lunchStartTime; }
    public void setLunchStartTime(LocalTime lunchStartTime) { this.lunchStartTime = lunchStartTime; }

    public LocalTime getLunchEndTime() { return lunchEndTime; }
    public void setLunchEndTime(LocalTime lunchEndTime) { this.lunchEndTime = lunchEndTime; }

    public Integer getLunchAllowedMinutes() { return lunchAllowedMinutes; }
    public void setLunchAllowedMinutes(Integer lunchAllowedMinutes) { this.lunchAllowedMinutes = lunchAllowedMinutes; }

    public Integer getLunchGraceMinutes() { return lunchGraceMinutes; }
    public void setLunchGraceMinutes(Integer lunchGraceMinutes) { this.lunchGraceMinutes = lunchGraceMinutes; }

    public LocalTime getBreak2StartTime() { return break2StartTime; }
    public void setBreak2StartTime(LocalTime break2StartTime) { this.break2StartTime = break2StartTime; }

    public LocalTime getBreak2EndTime() { return break2EndTime; }
    public void setBreak2EndTime(LocalTime break2EndTime) { this.break2EndTime = break2EndTime; }

    public Integer getBreak2AllowedMinutes() { return break2AllowedMinutes; }
    public void setBreak2AllowedMinutes(Integer break2AllowedMinutes) { this.break2AllowedMinutes = break2AllowedMinutes; }

    public Integer getBreak2GraceMinutes() { return break2GraceMinutes; }
    public void setBreak2GraceMinutes(Integer break2GraceMinutes) { this.break2GraceMinutes = break2GraceMinutes; }

    public Boolean getIsNightShift() { return isNightShift; }
    public void setIsNightShift(Boolean isNightShift) { this.isNightShift = isNightShift; }

    public Integer getMinWorkMinutes() { return minWorkMinutes; }
    public void setMinWorkMinutes(Integer minWorkMinutes) { this.minWorkMinutes = minWorkMinutes; }

    public Integer getMaxOvertimeMinutes() { return maxOvertimeMinutes; }
    public void setMaxOvertimeMinutes(Integer maxOvertimeMinutes) { this.maxOvertimeMinutes = maxOvertimeMinutes; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
