package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "performance_indicators")
public class PerformanceIndicator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "designation_id")
    private DesignationMaster designation;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private DepartmentMaster department;

    @Column(name = "approved_by", length = 160)
    private String approvedBy;

    @Column(name = "customer_experience", length = 40)
    private String customerExperience;

    @Column(name = "marketing", length = 40)
    private String marketing;

    @Column(name = "management", length = 40)
    private String management;

    @Column(name = "administration", length = 40)
    private String administration;

    @Column(name = "presentation_skills", length = 40)
    private String presentationSkills;

    @Column(name = "quality_of_work", length = 40)
    private String qualityOfWork;

    @Column(name = "efficiency", length = 40)
    private String efficiency;

    @Column(name = "integrity", length = 40)
    private String integrity;

    @Column(name = "professionalism", length = 40)
    private String professionalism;

    @Column(name = "team_work", length = 40)
    private String teamWork;

    @Column(name = "critical_thinking", length = 40)
    private String criticalThinking;

    @Column(name = "conflict_management", length = 40)
    private String conflictManagement;

    @Column(name = "attendance", length = 40)
    private String attendance;

    @Column(name = "ability_to_meet_deadline", length = 40)
    private String abilityToMeetDeadline;

    @Column(name = "status", length = 20)
    private String status; // Active / Inactive

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public DesignationMaster getDesignation() { return designation; }
    public void setDesignation(DesignationMaster designation) { this.designation = designation; }
    public DepartmentMaster getDepartment() { return department; }
    public void setDepartment(DepartmentMaster department) { this.department = department; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getDeleted() { return deleted; }
    public void setDeleted(Boolean deleted) { this.deleted = deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
