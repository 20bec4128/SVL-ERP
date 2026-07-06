package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class PerformanceIndicatorResponse {
    private Long id;
    private Long designationId;
    private String designationName;
    private Long departmentId;
    private String departmentName;
    private String approvedBy;
    private LocalDateTime createdDate;
    private String status;

    private String customerExperience;
    private String marketing;
    private String management;
    private String administration;
    private String presentationSkills;
    private String qualityOfWork;
    private String efficiency;
    private String integrity;
    private String professionalism;
    private String teamWork;
    private String criticalThinking;
    private String conflictManagement;
    private String attendance;
    private String abilityToMeetDeadline;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDesignationId() { return designationId; }
    public void setDesignationId(Long designationId) { this.designationId = designationId; }

    public String getDesignationName() { return designationName; }
    public void setDesignationName(String designationName) { this.designationName = designationName; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCustomerExperience() { return customerExperience; }
    public void setCustomerExperience(String customerExperience) { this.customerExperience = customerExperience; }
    public String getMarketing() { return marketing; }
    public void setMarketing(String marketing) { this.marketing = marketing; }
    public String getManagement() { return management; }
    public void setManagement(String management) { this.management = management; }
    public String getAdministration() { return administration; }
    public void setAdministration(String administration) { this.administration = administration; }
    public String getPresentationSkills() { return presentationSkills; }
    public void setPresentationSkills(String presentationSkills) { this.presentationSkills = presentationSkills; }
    public String getQualityOfWork() { return qualityOfWork; }
    public void setQualityOfWork(String qualityOfWork) { this.qualityOfWork = qualityOfWork; }
    public String getEfficiency() { return efficiency; }
    public void setEfficiency(String efficiency) { this.efficiency = efficiency; }

    public String getIntegrity() { return integrity; }
    public void setIntegrity(String integrity) { this.integrity = integrity; }
    public String getProfessionalism() { return professionalism; }
    public void setProfessionalism(String professionalism) { this.professionalism = professionalism; }
    public String getTeamWork() { return teamWork; }
    public void setTeamWork(String teamWork) { this.teamWork = teamWork; }
    public String getCriticalThinking() { return criticalThinking; }
    public void setCriticalThinking(String criticalThinking) { this.criticalThinking = criticalThinking; }
    public String getConflictManagement() { return conflictManagement; }
    public void setConflictManagement(String conflictManagement) { this.conflictManagement = conflictManagement; }
    public String getAttendance() { return attendance; }
    public void setAttendance(String attendance) { this.attendance = attendance; }
    public String getAbilityToMeetDeadline() { return abilityToMeetDeadline; }
    public void setAbilityToMeetDeadline(String abilityToMeetDeadline) { this.abilityToMeetDeadline = abilityToMeetDeadline; }
}
