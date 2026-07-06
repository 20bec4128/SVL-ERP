package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UserSettingsUpdateRequest {

    @NotNull(message = "allowProfileEditing is required")
    private Boolean allowProfileEditing;

    @NotNull(message = "allowPasswordChange is required")
    private Boolean allowPasswordChange;

    @NotNull(message = "enableTwoFactorAuth is required")
    private Boolean enableTwoFactorAuth;

    @NotBlank(message = "defaultLanguage is required")
    private String defaultLanguage;

    @NotBlank(message = "defaultTimezone is required")
    private String defaultTimezone;

    public Boolean getAllowProfileEditing() {
        return allowProfileEditing;
    }

    public void setAllowProfileEditing(Boolean allowProfileEditing) {
        this.allowProfileEditing = allowProfileEditing;
    }

    public Boolean getAllowPasswordChange() {
        return allowPasswordChange;
    }

    public void setAllowPasswordChange(Boolean allowPasswordChange) {
        this.allowPasswordChange = allowPasswordChange;
    }

    public Boolean getEnableTwoFactorAuth() {
        return enableTwoFactorAuth;
    }

    public void setEnableTwoFactorAuth(Boolean enableTwoFactorAuth) {
        this.enableTwoFactorAuth = enableTwoFactorAuth;
    }

    public String getDefaultLanguage() {
        return defaultLanguage;
    }

    public void setDefaultLanguage(String defaultLanguage) {
        this.defaultLanguage = defaultLanguage;
    }

    public String getDefaultTimezone() {
        return defaultTimezone;
    }

    public void setDefaultTimezone(String defaultTimezone) {
        this.defaultTimezone = defaultTimezone;
    }
}
