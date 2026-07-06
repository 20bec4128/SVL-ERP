package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class AttendanceBreakResponse {

    private Long id;
    private String breakType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBreakType() { return breakType; }
    public void setBreakType(String breakType) { this.breakType = breakType; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
}
