package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class SessionSettingsResponse {
    private Long id;
    private Integer sessionTimeoutMinutes;
    private Integer rememberMeDays;
    private Integer maxConcurrentSessions;
    private Boolean preventConcurrentLogins;
    private Integer warningBeforeLogoutSeconds;
    private LocalDateTime updatedAt;
    private String updatedBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getSessionTimeoutMinutes() {
        return sessionTimeoutMinutes;
    }

    public void setSessionTimeoutMinutes(Integer sessionTimeoutMinutes) {
        this.sessionTimeoutMinutes = sessionTimeoutMinutes;
    }

    public Integer getRememberMeDays() {
        return rememberMeDays;
    }

    public void setRememberMeDays(Integer rememberMeDays) {
        this.rememberMeDays = rememberMeDays;
    }

    public Integer getMaxConcurrentSessions() {
        return maxConcurrentSessions;
    }

    public void setMaxConcurrentSessions(Integer maxConcurrentSessions) {
        this.maxConcurrentSessions = maxConcurrentSessions;
    }

    public Boolean getPreventConcurrentLogins() {
        return preventConcurrentLogins;
    }

    public void setPreventConcurrentLogins(Boolean preventConcurrentLogins) {
        this.preventConcurrentLogins = preventConcurrentLogins;
    }

    public Integer getWarningBeforeLogoutSeconds() {
        return warningBeforeLogoutSeconds;
    }

    public void setWarningBeforeLogoutSeconds(Integer warningBeforeLogoutSeconds) {
        this.warningBeforeLogoutSeconds = warningBeforeLogoutSeconds;
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
