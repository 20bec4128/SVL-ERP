package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class ResignationRequest {

    private Long employeeId;
    private String employeeName;
    private String department;
    private String reason;

    @NotNull(message = "Notice date is required")
    private LocalDate noticeDate;

    @NotNull(message = "Resignation date is required")
    private LocalDate resignationDate;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDate getNoticeDate() { return noticeDate; }
    public void setNoticeDate(LocalDate noticeDate) { this.noticeDate = noticeDate; }

    public LocalDate getResignationDate() { return resignationDate; }
    public void setResignationDate(LocalDate resignationDate) { this.resignationDate = resignationDate; }
}
