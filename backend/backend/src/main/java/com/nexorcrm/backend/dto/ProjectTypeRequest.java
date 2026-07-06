package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ProjectTypeRequest {

    @NotBlank(message = "Project type is required")
    @Size(min = 2, max = 160, message = "Project type must be between 2 and 160 characters")
    private String projectType;

    public String getProjectType() { return projectType; }
    public void setProjectType(String projectType) { this.projectType = projectType; }
}
