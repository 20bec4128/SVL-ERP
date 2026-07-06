package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LeadTypeRequest {

    @NotBlank(message = "Lead type is required")
    @Size(min = 2, max = 160, message = "Lead type must be between 2 and 160 characters")
    private String leadType;

    public String getLeadType() {
        return leadType;
    }

    public void setLeadType(String leadType) {
        this.leadType = leadType;
    }
}
