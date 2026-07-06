package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LeadUpdateStatusRequest {

    @NotBlank(message = "Status is required")
    @Size(max = 100, message = "Status must be at most 100 characters")
    private String status;
    @Size(max = 255, message = "Rejected reason must be at most 255 characters")
    private String rejectedReason;
    @Size(max = 1000, message = "Rejected reason detail must be at most 1000 characters")
    private String rejectedReasonSubtype;
    private Long nextGroupId;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRejectedReason() {
        return rejectedReason;
    }

    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }

    public String getRejectedReasonSubtype() {
        return rejectedReasonSubtype;
    }

    public void setRejectedReasonSubtype(String rejectedReasonSubtype) {
        this.rejectedReasonSubtype = rejectedReasonSubtype;
    }

    public Long getNextGroupId() {
        return nextGroupId;
    }

    public void setNextGroupId(Long nextGroupId) {
        this.nextGroupId = nextGroupId;
    }
}
