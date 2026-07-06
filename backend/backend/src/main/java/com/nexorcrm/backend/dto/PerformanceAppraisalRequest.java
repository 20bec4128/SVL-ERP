package com.nexorcrm.backend.dto;

import java.time.LocalDate;
import java.util.List;

public class PerformanceAppraisalRequest {
    private Long employeeId;
    private LocalDate appraisalDate;
    private String status;
    private List<PerformanceAppraisalCompetency> technicalCompetencies;
    private List<PerformanceAppraisalCompetency> organizationalCompetencies;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public LocalDate getAppraisalDate() { return appraisalDate; }
    public void setAppraisalDate(LocalDate appraisalDate) { this.appraisalDate = appraisalDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<PerformanceAppraisalCompetency> getTechnicalCompetencies() { return technicalCompetencies; }
    public void setTechnicalCompetencies(List<PerformanceAppraisalCompetency> technicalCompetencies) { this.technicalCompetencies = technicalCompetencies; }

    public List<PerformanceAppraisalCompetency> getOrganizationalCompetencies() { return organizationalCompetencies; }
    public void setOrganizationalCompetencies(List<PerformanceAppraisalCompetency> organizationalCompetencies) { this.organizationalCompetencies = organizationalCompetencies; }
}
