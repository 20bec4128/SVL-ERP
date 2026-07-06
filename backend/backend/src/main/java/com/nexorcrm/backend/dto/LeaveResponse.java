package com.nexorcrm.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class LeaveResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private String department;
    private String policyName;
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal noOfDays;
    private String status;
    private String reason;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

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
