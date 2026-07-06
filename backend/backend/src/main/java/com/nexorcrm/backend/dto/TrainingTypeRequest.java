package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TrainingTypeRequest {

    @NotBlank(message = "Training type is required")
    @Size(min = 2, max = 160, message = "Training type must be between 2 and 160 characters")
    private String trainingType;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    private String status; // Active / Inactive

    public String getTrainingType() { return trainingType; }
    public void setTrainingType(String trainingType) { this.trainingType = trainingType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
