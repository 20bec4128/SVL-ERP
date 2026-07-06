package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SecurityPolicySettingsUpdateRequest {

    @NotNull(message = "minPasswordLength is required")
    @Min(value = 4, message = "minPasswordLength must be at least 4")
    private Integer minPasswordLength;

    @NotNull(message = "requireUppercase is required")
    private Boolean requireUppercase;

    @NotNull(message = "requireLowercase is required")
    private Boolean requireLowercase;

    @NotNull(message = "requireNumbers is required")
    private Boolean requireNumbers;

    @NotNull(message = "requireSpecialChars is required")
    private Boolean requireSpecialChars;

    @NotNull(message = "maxLoginAttempts is required")
    @Min(value = 1, message = "maxLoginAttempts must be at least 1")
    private Integer maxLoginAttempts;

    @NotNull(message = "lockoutDurationMinutes is required")
    @Min(value = 1, message = "lockoutDurationMinutes must be at least 1")
    private Integer lockoutDurationMinutes;

    @NotNull(message = "passwordExpiryDays is required")
    @Min(value = 1, message = "passwordExpiryDays must be at least 1")
    private Integer passwordExpiryDays;

    public Integer getMinPasswordLength() {
        return minPasswordLength;
    }

    public void setMinPasswordLength(Integer minPasswordLength) {
        this.minPasswordLength = minPasswordLength;
    }

    public Boolean getRequireUppercase() {
        return requireUppercase;
    }

    public void setRequireUppercase(Boolean requireUppercase) {
        this.requireUppercase = requireUppercase;
    }

    public Boolean getRequireLowercase() {
        return requireLowercase;
    }

    public void setRequireLowercase(Boolean requireLowercase) {
        this.requireLowercase = requireLowercase;
    }

    public Boolean getRequireNumbers() {
        return requireNumbers;
    }

    public void setRequireNumbers(Boolean requireNumbers) {
        this.requireNumbers = requireNumbers;
    }

    public Boolean getRequireSpecialChars() {
        return requireSpecialChars;
    }

    public void setRequireSpecialChars(Boolean requireSpecialChars) {
        this.requireSpecialChars = requireSpecialChars;
    }

    public Integer getMaxLoginAttempts() {
        return maxLoginAttempts;
    }

    public void setMaxLoginAttempts(Integer maxLoginAttempts) {
        this.maxLoginAttempts = maxLoginAttempts;
    }

    public Integer getLockoutDurationMinutes() {
        return lockoutDurationMinutes;
    }

    public void setLockoutDurationMinutes(Integer lockoutDurationMinutes) {
        this.lockoutDurationMinutes = lockoutDurationMinutes;
    }

    public Integer getPasswordExpiryDays() {
        return passwordExpiryDays;
    }

    public void setPasswordExpiryDays(Integer passwordExpiryDays) {
        this.passwordExpiryDays = passwordExpiryDays;
    }
}
