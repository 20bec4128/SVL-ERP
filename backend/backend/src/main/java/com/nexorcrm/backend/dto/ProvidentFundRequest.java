package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ProvidentFundRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    @NotBlank(message = "PF type is required")
    private String pfType;

    @NotNull(message = "Employee share amount is required")
    private BigDecimal employeeShareAmount;

    @NotNull(message = "Organization share amount is required")
    private BigDecimal organizationShareAmount;

    private String description;
    private String status;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

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
}
