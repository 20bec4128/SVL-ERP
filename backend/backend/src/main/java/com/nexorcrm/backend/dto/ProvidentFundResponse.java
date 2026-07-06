package com.nexorcrm.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProvidentFundResponse {

    private Long id;
    private Long employeeId;
    private String employeeCode;
    private String name;
    private String email;
    private String phone;
    private String designation;
    private LocalDate joinDate;

    private String pfType;
    private BigDecimal employeeShareAmount;
    private BigDecimal organizationShareAmount;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public LocalDate getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDate joinDate) { this.joinDate = joinDate; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
