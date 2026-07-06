package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.Role;
import jakarta.validation.constraints.NotNull;

public class RegistrationSettingsUpdateRequest {

    @NotNull(message = "allowSelfRegistration is required")
    private Boolean allowSelfRegistration;

    @NotNull(message = "requireEmailVerification is required")
    private Boolean requireEmailVerification;

    @NotNull(message = "requireAdminApproval is required")
    private Boolean requireAdminApproval;

    private String allowedDomains;

    @NotNull(message = "defaultRole is required")
    private Role defaultRole;

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
}
