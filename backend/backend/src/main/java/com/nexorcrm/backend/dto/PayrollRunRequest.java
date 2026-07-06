package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class PayrollRunRequest {

    @NotBlank(message = "Month is required")
    private String month; // e.g. "June 2026"

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }
}
