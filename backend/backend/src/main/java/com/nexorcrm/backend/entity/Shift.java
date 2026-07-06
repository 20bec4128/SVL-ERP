package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "shifts")
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "early_checkin_buffer_minutes", nullable = false)
    private Integer earlyCheckinBufferMinutes = 30;

    @Column(name = "late_checkin_buffer_minutes", nullable = false)
    private Integer lateCheckinBufferMinutes = 15;

    @Column(name = "break_allowed_minutes", nullable = false)
    private Integer breakAllowedMinutes = 15;

    @Column(name = "break_grace_minutes", nullable = false)
    private Integer breakGraceMinutes = 5;

    @Column(name = "break1_start_time")
    private LocalTime break1StartTime;

    @Column(name = "break1_end_time")
    private LocalTime break1EndTime;

    @Column(name = "break1_allowed_minutes", nullable = false)
    private Integer break1AllowedMinutes = 15;

    @Column(name = "break1_grace_minutes", nullable = false)
    private Integer break1GraceMinutes = 5;

    @Column(name = "lunch_start_time")
    private LocalTime lunchStartTime;

    @Column(name = "lunch_end_time")
    private LocalTime lunchEndTime;

    @Column(name = "lunch_allowed_minutes", nullable = false)
    private Integer lunchAllowedMinutes = 60;

    @Column(name = "lunch_grace_minutes", nullable = false)
    private Integer lunchGraceMinutes = 10;

    @Column(name = "break2_start_time")
    private LocalTime break2StartTime;

    @Column(name = "break2_end_time")
    private LocalTime break2EndTime;

    @Column(name = "break2_allowed_minutes", nullable = false)
    private Integer break2AllowedMinutes = 15;

    @Column(name = "break2_grace_minutes", nullable = false)
    private Integer break2GraceMinutes = 5;

    @Column(name = "is_night_shift", nullable = false)
    private Boolean isNightShift = false;

    @Column(name = "min_work_minutes", nullable = false)
    private Integer minWorkMinutes = 480;

    @Column(name = "max_overtime_minutes")
    private Integer maxOvertimeMinutes = 120;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private Boolean deleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Getters & Setters ──

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

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
