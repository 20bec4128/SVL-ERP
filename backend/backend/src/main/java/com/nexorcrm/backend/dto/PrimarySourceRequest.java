package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PrimarySourceRequest {

    @NotBlank(message = "Primary source is required")
    @Size(min = 2, max = 160, message = "Primary source must be between 2 and 160 characters")
    private String primarySource;

    public String getPrimarySource() {
        return primarySource;
    }

    public void setPrimarySource(String primarySource) {
        this.primarySource = primarySource;
    }
}
