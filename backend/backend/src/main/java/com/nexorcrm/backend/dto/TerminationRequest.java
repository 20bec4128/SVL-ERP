package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class TerminationRequest {

    private Long employeeId;
    private String employeeName;
    private String department;

    @NotBlank(message = "Termination type is required")
    private String terminationType;

    @NotNull(message = "Notice date is required")
    private LocalDate noticeDate;

    @NotBlank(message = "Reason is required")
    private String reason;

    @NotNull(message = "Termination date is required")
    private LocalDate terminationDate;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getTerminationType() { return terminationType; }
    public void setTerminationType(String terminationType) { this.terminationType = terminationType; }

    public LocalDate getNoticeDate() { return noticeDate; }
    public void setNoticeDate(LocalDate noticeDate) { this.noticeDate = noticeDate; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDate getTerminationDate() { return terminationDate; }
    public void setTerminationDate(LocalDate terminationDate) { this.terminationDate = terminationDate; }
}
