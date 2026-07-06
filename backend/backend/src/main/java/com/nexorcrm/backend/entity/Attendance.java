package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "attendance_date"})
})
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "shift_id")
    private Long shiftId;

    @Column(name = "location_id")
    private Long locationId;

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "check_in_lat")
    private Double checkInLat;

    @Column(name = "check_in_lng")
    private Double checkInLng;

    @Column(name = "check_in_accuracy")
    private Double checkInAccuracy;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    @Column(name = "check_out_lat")
    private Double checkOutLat;

    @Column(name = "check_out_lng")
    private Double checkOutLng;

    @Column(name = "check_out_accuracy")
    private Double checkOutAccuracy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AttendanceStatus status = AttendanceStatus.CHECKED_IN;

    @Column(name = "total_work_minutes")
    private Integer totalWorkMinutes = 0;

    @Column(name = "break_time_minutes")
    private Integer breakTimeMinutes = 0;

    @Column(name = "break1_time_minutes")
    private Integer break1TimeMinutes = 0;

    @Column(name = "break2_time_minutes")
    private Integer break2TimeMinutes = 0;

    @Column(name = "lunch_time_minutes")
    private Integer lunchTimeMinutes = 0;

    @Column(name = "excess_break_minutes")
    private Integer excessBreakMinutes = 0;

    @Column(name = "excess_break1_minutes")
    private Integer excessBreak1Minutes = 0;

    @Column(name = "excess_break2_minutes")
    private Integer excessBreak2Minutes = 0;

    @Column(name = "excess_lunch_minutes")
    private Integer excessLunchMinutes = 0;

    @Column(name = "net_work_minutes")
    private Integer netWorkMinutes = 0;

    @Column(name = "is_late", nullable = false)
    private Boolean isLate = false;

    @Column(name = "late_minutes")
    private Integer lateMinutes = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_status", length = 30)
    private WorkStatus workStatus = WorkStatus.INCOMPLETE;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "overtime_minutes")
    private Integer overtimeMinutes = 0;

    @Column(name = "is_missed_checkout")
    private Boolean isMissedCheckout = false;

    @Column(name = "missed_checkout_flagged_at")
    private LocalDateTime missedCheckoutFlaggedAt;

    @Column(nullable = false)
    private Boolean deleted = false;

    @Column(name = "late_checkin_allowed")
    private Boolean lateCheckinAllowed = false;

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

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }

    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }

    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }

    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }

    public Double getCheckInLat() { return checkInLat; }
    public void setCheckInLat(Double checkInLat) { this.checkInLat = checkInLat; }

    public Double getCheckInLng() { return checkInLng; }
    public void setCheckInLng(Double checkInLng) { this.checkInLng = checkInLng; }

    public Double getCheckInAccuracy() { return checkInAccuracy; }
    public void setCheckInAccuracy(Double checkInAccuracy) { this.checkInAccuracy = checkInAccuracy; }

    public LocalDateTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalDateTime checkOutTime) { this.checkOutTime = checkOutTime; }

    public Double getCheckOutLat() { return checkOutLat; }
    public void setCheckOutLat(Double checkOutLat) { this.checkOutLat = checkOutLat; }

    public Double getCheckOutLng() { return checkOutLng; }
    public void setCheckOutLng(Double checkOutLng) { this.checkOutLng = checkOutLng; }

    public Double getCheckOutAccuracy() { return checkOutAccuracy; }
    public void setCheckOutAccuracy(Double checkOutAccuracy) { this.checkOutAccuracy = checkOutAccuracy; }

    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }

    public Integer getTotalWorkMinutes() { return totalWorkMinutes; }
    public void setTotalWorkMinutes(Integer totalWorkMinutes) { this.totalWorkMinutes = totalWorkMinutes; }

    public Integer getBreakTimeMinutes() { return breakTimeMinutes; }
    public void setBreakTimeMinutes(Integer breakTimeMinutes) { this.breakTimeMinutes = breakTimeMinutes; }

    public Integer getBreak1TimeMinutes() { return break1TimeMinutes; }
    public void setBreak1TimeMinutes(Integer break1TimeMinutes) { this.break1TimeMinutes = break1TimeMinutes; }

    public Integer getBreak2TimeMinutes() { return break2TimeMinutes; }
    public void setBreak2TimeMinutes(Integer break2TimeMinutes) { this.break2TimeMinutes = break2TimeMinutes; }

    public Integer getLunchTimeMinutes() { return lunchTimeMinutes; }
    public void setLunchTimeMinutes(Integer lunchTimeMinutes) { this.lunchTimeMinutes = lunchTimeMinutes; }

    public Integer getExcessBreakMinutes() { return excessBreakMinutes; }
    public void setExcessBreakMinutes(Integer excessBreakMinutes) { this.excessBreakMinutes = excessBreakMinutes; }

    public Integer getExcessBreak1Minutes() { return excessBreak1Minutes; }
    public void setExcessBreak1Minutes(Integer excessBreak1Minutes) { this.excessBreak1Minutes = excessBreak1Minutes; }

    public Integer getExcessBreak2Minutes() { return excessBreak2Minutes; }
    public void setExcessBreak2Minutes(Integer excessBreak2Minutes) { this.excessBreak2Minutes = excessBreak2Minutes; }

    public Integer getExcessLunchMinutes() { return excessLunchMinutes; }
    public void setExcessLunchMinutes(Integer excessLunchMinutes) { this.excessLunchMinutes = excessLunchMinutes; }

    public Integer getNetWorkMinutes() { return netWorkMinutes; }
    public void setNetWorkMinutes(Integer netWorkMinutes) { this.netWorkMinutes = netWorkMinutes; }

    public Boolean getIsLate() { return isLate; }
    public void setIsLate(Boolean isLate) { this.isLate = isLate; }

    public Integer getLateMinutes() { return lateMinutes; }
    public void setLateMinutes(Integer lateMinutes) { this.lateMinutes = lateMinutes; }

    public WorkStatus getWorkStatus() { return workStatus; }
    public void setWorkStatus(WorkStatus workStatus) { this.workStatus = workStatus; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Integer getOvertimeMinutes() { return overtimeMinutes; }
    public void setOvertimeMinutes(Integer overtimeMinutes) { this.overtimeMinutes = overtimeMinutes; }

    public Boolean getIsMissedCheckout() { return isMissedCheckout; }
    public void setIsMissedCheckout(Boolean isMissedCheckout) { this.isMissedCheckout = isMissedCheckout; }

    public LocalDateTime getMissedCheckoutFlaggedAt() { return missedCheckoutFlaggedAt; }
    public void setMissedCheckoutFlaggedAt(LocalDateTime missedCheckoutFlaggedAt) { this.missedCheckoutFlaggedAt = missedCheckoutFlaggedAt; }

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getLateCheckinAllowed() { return lateCheckinAllowed; }
    public void setLateCheckinAllowed(Boolean lateCheckinAllowed) { this.lateCheckinAllowed = lateCheckinAllowed; }
}
