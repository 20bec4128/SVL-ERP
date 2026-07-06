package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class UserSettingsResponse {
    private Long id;
    private Boolean allowProfileEditing;
    private Boolean allowPasswordChange;
    private Boolean enableTwoFactorAuth;
    private String defaultLanguage;
    private String defaultTimezone;
    private LocalDateTime updatedAt;
    private String updatedBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
