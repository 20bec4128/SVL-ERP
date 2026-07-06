package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.EmployeeTokenScope;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PublicEmployeeFormResponse {
    private Long employeeId;
    private String name;
    private String emailMasked;
    private String phoneMasked;
    private EmployeeTokenScope scope;
    private LocalDateTime expiresAt;
    private List<PublicEmployeeFormFieldDto> fields = new ArrayList<>();
    private List<PublicEmployeeFormUploadDto> uploads = new ArrayList<>();

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmailMasked() {
        return emailMasked;
    }

    public void setEmailMasked(String emailMasked) {
        this.emailMasked = emailMasked;
    }

    public String getPhoneMasked() {
        return phoneMasked;
    }

    public void setPhoneMasked(String phoneMasked) {
        this.phoneMasked = phoneMasked;
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

    public List<PublicEmployeeFormFieldDto> getFields() {
        return fields;
    }

    public void setFields(List<PublicEmployeeFormFieldDto> fields) {
        this.fields = fields;
    }

    public List<PublicEmployeeFormUploadDto> getUploads() {
        return uploads;
    }

    public void setUploads(List<PublicEmployeeFormUploadDto> uploads) {
        this.uploads = uploads;
    }
}
