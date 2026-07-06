package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "leave_policies")
public class LeavePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = true)
    @JoinColumn(name = "leave_type_id", nullable = true)
    private LeaveType leaveType;

    @Column(name = "name", nullable = false, length = 160)
    private String name;

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

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<LeavePolicyEmployee> employees = new HashSet<>();

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
        if (deleted == null) deleted = false;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

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

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }

    public Set<LeavePolicyEmployee> getEmployees() { return employees; }
    public void setEmployees(Set<LeavePolicyEmployee> employees) { this.employees = employees; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
