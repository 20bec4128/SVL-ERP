package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.Role;
import java.time.LocalDateTime;

public class RegistrationSettingsResponse {
    private Long id;
    private Boolean allowSelfRegistration;
    private Boolean requireEmailVerification;
    private Boolean requireAdminApproval;
    private String allowedDomains;
    private Role defaultRole;
    private LocalDateTime updatedAt;
    private String updatedBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Boolean getAllowSelfRegistration() {
        return allowSelfRegistration;
    }

    public void setAllowSelfRegistration(Boolean allowSelfRegistration) {
        this.allowSelfRegistration = allowSelfRegistration;
    }

    public Boolean getRequireEmailVerification() {
        return requireEmailVerification;
    }

    public void setRequireEmailVerification(Boolean requireEmailVerification) {
        this.requireEmailVerification = requireEmailVerification;
    }

    public Boolean getRequireAdminApproval() {
        return requireAdminApproval;
    }

    public void setRequireAdminApproval(Boolean requireAdminApproval) {
        this.requireAdminApproval = requireAdminApproval;
    }

    public String getAllowedDomains() {
        return allowedDomains;
    }

    public void setAllowedDomains(String allowedDomains) {
        this.allowedDomains = allowedDomains;
    }

    public Role getDefaultRole() {
        return defaultRole;
    }

    public void setDefaultRole(Role defaultRole) {
        this.defaultRole = defaultRole;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
