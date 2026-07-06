package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class LeaveRequest {

    @NotNull
    private Long employeeId;

    @NotBlank
    private String policyName;

    @NotNull
    private LocalDate fromDate;

    @NotNull
    private LocalDate toDate;

    private BigDecimal noOfDays;
    private String status; // NEW / APPROVED / DECLINED
    private String reason;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getPolicyName() { return policyName; }
    public void setPolicyName(String policyName) { this.policyName = policyName; }

    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }

    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }

    public BigDecimal getNoOfDays() { return noOfDays; }
    public void setNoOfDays(BigDecimal noOfDays) { this.noOfDays = noOfDays; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
