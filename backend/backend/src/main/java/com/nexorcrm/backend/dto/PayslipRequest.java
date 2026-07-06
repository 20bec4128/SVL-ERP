package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PayslipRequest {

    @NotNull(message = "Employee ID is required")
    private Long employeeId;

    private Long employeeSalaryId;

    @NotBlank(message = "Month is required")
    private String month; // e.g. "January 2026"

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public Long getEmployeeSalaryId() { return employeeSalaryId; }
    public void setEmployeeSalaryId(Long employeeSalaryId) { this.employeeSalaryId = employeeSalaryId; }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
}
