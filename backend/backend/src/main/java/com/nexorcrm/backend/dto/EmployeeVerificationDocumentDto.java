package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.EmployeeDocumentType;
import com.nexorcrm.backend.entity.VerificationStatus;

import java.time.LocalDateTime;

public class EmployeeVerificationDocumentDto {
    private Long id;
    private EmployeeDocumentType docType;
    private String fileUrl;
    private String originalFilename;
    private VerificationStatus status;
    private String remarks;
    private LocalDateTime uploadedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public EmployeeDocumentType getDocType() {
        return docType;
    }

    public void setDocType(EmployeeDocumentType docType) {
        this.docType = docType;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public VerificationStatus getStatus() {
        return status;
    }

    public void setStatus(VerificationStatus status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}

