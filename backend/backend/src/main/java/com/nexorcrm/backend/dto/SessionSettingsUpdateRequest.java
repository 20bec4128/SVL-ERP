package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SessionSettingsUpdateRequest {

    @NotNull(message = "sessionTimeoutMinutes is required")
    @Min(value = 1, message = "sessionTimeoutMinutes must be at least 1")
    private Integer sessionTimeoutMinutes;

    @NotNull(message = "rememberMeDays is required")
    @Min(value = 1, message = "rememberMeDays must be at least 1")
    private Integer rememberMeDays;

    @NotNull(message = "maxConcurrentSessions is required")
    @Min(value = 1, message = "maxConcurrentSessions must be at least 1")
    private Integer maxConcurrentSessions;

    @NotNull(message = "preventConcurrentLogins is required")
    private Boolean preventConcurrentLogins;

    @NotNull(message = "warningBeforeLogoutSeconds is required")
    @Min(value = 1, message = "warningBeforeLogoutSeconds must be at least 1")
    private Integer warningBeforeLogoutSeconds;

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
}
