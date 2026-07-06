package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.EmployeeTokenScope;

import java.time.LocalDateTime;

public class EmployeeFormLinkResponse {
    private Long employeeId;
    private EmployeeTokenScope scope;
    private LocalDateTime expiresAt;
    private String publicUrl;

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public EmployeeTokenScope getScope() {
        return scope;
    }

    public void setScope(EmployeeTokenScope scope) {
        this.scope = scope;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getPublicUrl() {
        return publicUrl;
    }

    public void setPublicUrl(String publicUrl) {
        this.publicUrl = publicUrl;
    }
}

