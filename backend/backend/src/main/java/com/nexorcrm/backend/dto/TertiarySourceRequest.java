package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TertiarySourceRequest {

    @NotBlank(message = "Tertiary source is required")
    @Size(min = 2, max = 160, message = "Tertiary source must be between 2 and 160 characters")
    private String tertiarySource;

    public String getTertiarySource() {
        return tertiarySource;
    }

    public void setTertiarySource(String tertiarySource) {
        this.tertiarySource = tertiarySource;
    }
}
