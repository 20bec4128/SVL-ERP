package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.EmployeeProfileStatus;

import java.util.ArrayList;
import java.util.List;

public class EmployeeVerificationResponse {
    private Long employeeId;
    private EmployeeProfileStatus profileStatus;
    private boolean profileCompletionMailSent;
    private boolean profileLinkEverGenerated;
    private List<EmployeeVerificationFieldDto> fields = new ArrayList<>();
    private List<EmployeeVerificationDocumentDto> documents = new ArrayList<>();

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public EmployeeProfileStatus getProfileStatus() {
        return profileStatus;
    }

    public void setProfileStatus(EmployeeProfileStatus profileStatus) {
        this.profileStatus = profileStatus;
    }

    public boolean isProfileCompletionMailSent() {
        return profileCompletionMailSent;
    }

    public void setProfileCompletionMailSent(boolean profileCompletionMailSent) {
        this.profileCompletionMailSent = profileCompletionMailSent;
    }

    public boolean isProfileLinkEverGenerated() {
        return profileLinkEverGenerated;
    }

    public void setProfileLinkEverGenerated(boolean profileLinkEverGenerated) {
        this.profileLinkEverGenerated = profileLinkEverGenerated;
    }

    public List<EmployeeVerificationFieldDto> getFields() {
        return fields;
    }

    public void setFields(List<EmployeeVerificationFieldDto> fields) {
        this.fields = fields;
    }

    public List<EmployeeVerificationDocumentDto> getDocuments() {
        return documents;
    }

    public void setDocuments(List<EmployeeVerificationDocumentDto> documents) {
        this.documents = documents;
    }
}
