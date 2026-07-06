package com.nexorcrm.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import java.time.LocalDateTime;

@Entity
@Table(name = "lead_flow_config")
public class LeadFlowConfig {

    @Id
    private Long id = 1L;

    @Column(name = "default_group_id")
    private Long defaultGroupId;

    @Column(name = "rules_json", columnDefinition = "text")
    private String rulesJson;

    @Column(name = "statuses_json", columnDefinition = "text")
    private String statusesJson;

    @Column(name = "scoped_flow_json", columnDefinition = "text")
    private String scopedFlowJson;

    @Column(name = "updated_by", length = 120)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDefaultGroupId() {
        return defaultGroupId;
    }

    public void setDefaultGroupId(Long defaultGroupId) {
        this.defaultGroupId = defaultGroupId;
    }

    public String getStatusesJson() {
        return statusesJson;
    }

    public void setStatusesJson(String statusesJson) {
        this.statusesJson = statusesJson;
    }

    public String getRulesJson() {
        return rulesJson;
    }

    public void setRulesJson(String rulesJson) {
        this.rulesJson = rulesJson;
    }

    public String getScopedFlowJson() {
        return scopedFlowJson;
    }

    public void setScopedFlowJson(String scopedFlowJson) {
        this.scopedFlowJson = scopedFlowJson;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
