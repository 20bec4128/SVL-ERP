package com.nexorcrm.backend.dto;

import java.time.LocalDate;

public class TimesheetRequest {
    private Long employeeId;
    private String projectName;
    private LocalDate deadline;
    private Integer totalHours;
    private Integer remainingHours;
    private LocalDate workDate;
    private Integer workedHours;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public Integer getTotalHours() { return totalHours; }
    public void setTotalHours(Integer totalHours) { this.totalHours = totalHours; }

    public Integer getRemainingHours() { return remainingHours; }
    public void setRemainingHours(Integer remainingHours) { this.remainingHours = remainingHours; }

    public LocalDate getWorkDate() { return workDate; }
    public void setWorkDate(LocalDate workDate) { this.workDate = workDate; }

    public Integer getWorkedHours() { return workedHours; }
    public void setWorkedHours(Integer workedHours) { this.workedHours = workedHours; }
}
