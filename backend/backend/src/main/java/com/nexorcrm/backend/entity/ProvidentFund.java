package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "provident_funds")
public class ProvidentFund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "pf_type", nullable = false, length = 100)
    private String pfType; // Employee Share / Employer Share

    @Column(name = "employee_share_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal employeeShareAmount = BigDecimal.ZERO;

    @Column(name = "organization_share_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal organizationShareAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String status = "Pending"; // Pending / Approved / Rejected

    @Column(name = "deleted", nullable = false)
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
        if (employeeShareAmount == null) employeeShareAmount = BigDecimal.ZERO;
        if (organizationShareAmount == null) organizationShareAmount = BigDecimal.ZERO;
        if (status == null || status.isBlank()) status = "Pending";
        if (deleted == null) deleted = false;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public String getPfType() { return pfType; }
    public void setPfType(String pfType) { this.pfType = pfType; }

    public BigDecimal getEmployeeShareAmount() { return employeeShareAmount; }
    public void setEmployeeShareAmount(BigDecimal employeeShareAmount) { this.employeeShareAmount = employeeShareAmount; }

    public BigDecimal getOrganizationShareAmount() { return organizationShareAmount; }
    public void setOrganizationShareAmount(BigDecimal organizationShareAmount) { this.organizationShareAmount = organizationShareAmount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
