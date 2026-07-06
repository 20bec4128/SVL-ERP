package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class BranchWorkflowConfigResponse {

    private Long id;
    private Long branchId;
    private String branchName;

    private Long leadDesignationId;
    private String leadDesignationName;
    private Long leadTeamLeadUserId;
    private String leadTeamLeadUserName;

    private Long designDesignationId;
    private String designDesignationName;
    private Long designTeamLeadUserId;
    private String designTeamLeadUserName;

    private Long productionDesignationId;
    private String productionDesignationName;
    private Long productionTeamLeadUserId;
    private String productionTeamLeadUserName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public Long getLeadDesignationId() {
        return leadDesignationId;
    }

    public void setLeadDesignationId(Long leadDesignationId) {
        this.leadDesignationId = leadDesignationId;
    }

    public String getLeadDesignationName() {
        return leadDesignationName;
    }

    public void setLeadDesignationName(String leadDesignationName) {
        this.leadDesignationName = leadDesignationName;
    }

    public Long getLeadTeamLeadUserId() {
        return leadTeamLeadUserId;
    }

    public void setLeadTeamLeadUserId(Long leadTeamLeadUserId) {
        this.leadTeamLeadUserId = leadTeamLeadUserId;
    }

    public String getLeadTeamLeadUserName() {
        return leadTeamLeadUserName;
    }

    public void setLeadTeamLeadUserName(String leadTeamLeadUserName) {
        this.leadTeamLeadUserName = leadTeamLeadUserName;
    }

    public Long getDesignDesignationId() {
        return designDesignationId;
    }

    public void setDesignDesignationId(Long designDesignationId) {
        this.designDesignationId = designDesignationId;
    }

    public String getDesignDesignationName() {
        return designDesignationName;
    }

    public void setDesignDesignationName(String designDesignationName) {
        this.designDesignationName = designDesignationName;
    }

    public Long getDesignTeamLeadUserId() {
        return designTeamLeadUserId;
    }

    public void setDesignTeamLeadUserId(Long designTeamLeadUserId) {
        this.designTeamLeadUserId = designTeamLeadUserId;
    }

    public String getDesignTeamLeadUserName() {
        return designTeamLeadUserName;
    }

    public void setDesignTeamLeadUserName(String designTeamLeadUserName) {
        this.designTeamLeadUserName = designTeamLeadUserName;
    }

    public Long getProductionDesignationId() {
        return productionDesignationId;
    }

    public void setProductionDesignationId(Long productionDesignationId) {
        this.productionDesignationId = productionDesignationId;
    }

    public String getProductionDesignationName() {
        return productionDesignationName;
    }

    public void setProductionDesignationName(String productionDesignationName) {
        this.productionDesignationName = productionDesignationName;
    }

    public Long getProductionTeamLeadUserId() {
        return productionTeamLeadUserId;
    }

    public void setProductionTeamLeadUserId(Long productionTeamLeadUserId) {
        this.productionTeamLeadUserId = productionTeamLeadUserId;
    }

    public String getProductionTeamLeadUserName() {
        return productionTeamLeadUserName;
    }

    public void setProductionTeamLeadUserName(String productionTeamLeadUserName) {
        this.productionTeamLeadUserName = productionTeamLeadUserName;
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
