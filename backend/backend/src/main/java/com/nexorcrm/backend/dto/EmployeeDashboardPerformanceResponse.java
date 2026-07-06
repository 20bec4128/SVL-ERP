package com.nexorcrm.backend.dto;

import java.time.LocalDate;

public class EmployeeDashboardPerformanceResponse {
    private Long appraisalId;
    private String status;
    private LocalDate reviewDate;
    private Integer completionPercent;
    private Integer technicalCompetencies;
    private Integer organizationalCompetencies;
    private String summary;

    public Long getAppraisalId() {
        return appraisalId;
    }

    public void setAppraisalId(Long appraisalId) {
        this.appraisalId = appraisalId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getReviewDate() {
        return reviewDate;
    }

    public void setReviewDate(LocalDate reviewDate) {
        this.reviewDate = reviewDate;
    }

    public Integer getCompletionPercent() {
        return completionPercent;
    }

    public void setCompletionPercent(Integer completionPercent) {
        this.completionPercent = completionPercent;
    }

    public Integer getTechnicalCompetencies() {
        return technicalCompetencies;
    }

    public void setTechnicalCompetencies(Integer technicalCompetencies) {
        this.technicalCompetencies = technicalCompetencies;
    }

    public Integer getOrganizationalCompetencies() {
        return organizationalCompetencies;
    }

    public void setOrganizationalCompetencies(Integer organizationalCompetencies) {
        this.organizationalCompetencies = organizationalCompetencies;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}
