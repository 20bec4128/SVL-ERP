package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "session_settings")
public class SessionSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_timeout_minutes", nullable = false)
    private Integer sessionTimeoutMinutes = 60;

    @Column(name = "remember_me_days", nullable = false)
    private Integer rememberMeDays = 30;

    @Column(name = "max_concurrent_sessions", nullable = false)
    private Integer maxConcurrentSessions = 5;

    @Column(name = "prevent_concurrent_logins", nullable = false)
    private Boolean preventConcurrentLogins = false;

    @Column(name = "warning_before_logout_seconds", nullable = false)
    private Integer warningBeforeLogoutSeconds = 60;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 255)
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
