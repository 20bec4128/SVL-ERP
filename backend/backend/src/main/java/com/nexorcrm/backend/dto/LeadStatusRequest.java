package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LeadStatusRequest {

    @NotBlank(message = "Lead status is required")
    @Size(min = 2, max = 160, message = "Lead status must be between 2 and 160 characters")
    private String leadStatus;

    public String getLeadStatus() {
        return leadStatus;
    }

    public void setLeadStatus(String leadStatus) {
        this.leadStatus = leadStatus;
    }
}
