package com.nexorcrm.backend.dto;

import java.time.LocalDate;
import java.util.List;

public class PerformanceAppraisalResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String department;
    private String designation;
    private LocalDate appraisalDate;
    private String status;
    private List<PerformanceAppraisalCompetency> technicalCompetencies;
    private List<PerformanceAppraisalCompetency> organizationalCompetencies;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public LocalDate getAppraisalDate() { return appraisalDate; }
    public void setAppraisalDate(LocalDate appraisalDate) { this.appraisalDate = appraisalDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<PerformanceAppraisalCompetency> getTechnicalCompetencies() { return technicalCompetencies; }
    public void setTechnicalCompetencies(List<PerformanceAppraisalCompetency> technicalCompetencies) { this.technicalCompetencies = technicalCompetencies; }

    public List<PerformanceAppraisalCompetency> getOrganizationalCompetencies() { return organizationalCompetencies; }
    public void setOrganizationalCompetencies(List<PerformanceAppraisalCompetency> organizationalCompetencies) { this.organizationalCompetencies = organizationalCompetencies; }
}
