package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "allow_profile_editing", nullable = false)
    private Boolean allowProfileEditing = true;

    @Column(name = "allow_password_change", nullable = false)
    private Boolean allowPasswordChange = true;

    @Column(name = "enable_two_factor_auth", nullable = false)
    private Boolean enableTwoFactorAuth = false;

    @Column(name = "default_language", nullable = false, length = 50)
    private String defaultLanguage = "en";

    @Column(name = "default_timezone", nullable = false, length = 50)
    private String defaultTimezone = "UTC";

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
