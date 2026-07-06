package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_type_settings")
public class LeaveTypeSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "leave_type_id", nullable = false, unique = true)
    private LeaveType leaveType;

    @Column(name = "days_per_year", nullable = false)
    private Integer daysPerYear = 0;

    @Column(name = "carry_forward_enabled", nullable = false)
    private Boolean carryForwardEnabled = false;

    @Column(name = "max_carry_forward_days")
    private Integer maxCarryForwardDays;

    @Column(name = "max_days_per_request")
    private Integer maxDaysPerRequest;

    @Column(name = "earned_leave_enabled", nullable = false)
    private Boolean earnedLeaveEnabled = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (daysPerYear == null) daysPerYear = 0;
        if (carryForwardEnabled == null) carryForwardEnabled = false;
        if (earnedLeaveEnabled == null) earnedLeaveEnabled = false;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public Integer getDaysPerYear() { return daysPerYear; }
    public void setDaysPerYear(Integer daysPerYear) { this.daysPerYear = daysPerYear; }

    public Boolean getCarryForwardEnabled() { return carryForwardEnabled; }
    public void setCarryForwardEnabled(Boolean carryForwardEnabled) { this.carryForwardEnabled = carryForwardEnabled; }

    public Integer getMaxCarryForwardDays() { return maxCarryForwardDays; }
    public void setMaxCarryForwardDays(Integer maxCarryForwardDays) { this.maxCarryForwardDays = maxCarryForwardDays; }

    public Integer getMaxDaysPerRequest() { return maxDaysPerRequest; }
    public void setMaxDaysPerRequest(Integer maxDaysPerRequest) { this.maxDaysPerRequest = maxDaysPerRequest; }

    public Boolean getEarnedLeaveEnabled() { return earnedLeaveEnabled; }
    public void setEarnedLeaveEnabled(Boolean earnedLeaveEnabled) { this.earnedLeaveEnabled = earnedLeaveEnabled; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
