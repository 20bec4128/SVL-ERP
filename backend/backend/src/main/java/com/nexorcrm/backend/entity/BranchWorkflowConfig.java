package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "branch_workflow_configs")
public class BranchWorkflowConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    private BranchMaster branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lead_designation_id")
    private UserDesignation leadDesignation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lead_team_lead_user_id")
    private User leadTeamLeadUser;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "design_designation_id")
    private UserDesignation designDesignation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "design_team_lead_user_id")
    private User designTeamLeadUser;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "production_designation_id")
    private UserDesignation productionDesignation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "production_team_lead_user_id")
    private User productionTeamLeadUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BranchMaster getBranch() {
        return branch;
    }

    public void setBranch(BranchMaster branch) {
        this.branch = branch;
    }

    public UserDesignation getLeadDesignation() {
        return leadDesignation;
    }

    public void setLeadDesignation(UserDesignation leadDesignation) {
        this.leadDesignation = leadDesignation;
    }

    public User getLeadTeamLeadUser() {
        return leadTeamLeadUser;
    }

    public void setLeadTeamLeadUser(User leadTeamLeadUser) {
        this.leadTeamLeadUser = leadTeamLeadUser;
    }

    public UserDesignation getDesignDesignation() {
        return designDesignation;
    }

    public void setDesignDesignation(UserDesignation designDesignation) {
        this.designDesignation = designDesignation;
    }

    public User getDesignTeamLeadUser() {
        return designTeamLeadUser;
    }

    public void setDesignTeamLeadUser(User designTeamLeadUser) {
        this.designTeamLeadUser = designTeamLeadUser;
    }

    public UserDesignation getProductionDesignation() {
        return productionDesignation;
    }

    public void setProductionDesignation(UserDesignation productionDesignation) {
        this.productionDesignation = productionDesignation;
    }

    public User getProductionTeamLeadUser() {
        return productionTeamLeadUser;
    }

    public void setProductionTeamLeadUser(User productionTeamLeadUser) {
        this.productionTeamLeadUser = productionTeamLeadUser;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
