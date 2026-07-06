package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SecondarySourceRequest {

    @NotBlank(message = "Secondary source is required")
    @Size(min = 2, max = 160, message = "Secondary source must be between 2 and 160 characters")
    private String secondarySource;

    @NotNull(message = "Primary source is required")
    private Long primarySourceId;

    public String getSecondarySource() {
        return secondarySource;
    }

    public void setSecondarySource(String secondarySource) {
        this.secondarySource = secondarySource;
    }

    public Long getPrimarySourceId() {
        return primarySourceId;
    }

    public void setPrimarySourceId(Long primarySourceId) {
        this.primarySourceId = primarySourceId;
    }
}
