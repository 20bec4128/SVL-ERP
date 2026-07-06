package com.nexorcrm.backend.dto;

import java.time.LocalDate;

public class TimesheetResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeDept;
    private String employeeDesignation;
    private String projectName;
    private LocalDate deadline;
    private Integer totalHours;
    private Integer remainingHours;
    private LocalDate workDate;
    private Integer workedHours;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getEmployeeDept() { return employeeDept; }
    public void setEmployeeDept(String employeeDept) { this.employeeDept = employeeDept; }

    public String getEmployeeDesignation() { return employeeDesignation; }
    public void setEmployeeDesignation(String employeeDesignation) { this.employeeDesignation = employeeDesignation; }

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
