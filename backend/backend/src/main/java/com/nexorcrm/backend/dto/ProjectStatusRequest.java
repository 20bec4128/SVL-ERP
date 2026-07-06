package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ProjectStatusRequest {

    @NotBlank(message = "Project status is required")
    @Size(min = 2, max = 160, message = "Project status must be between 2 and 160 characters")
    private String projectStatus;

    public String getProjectStatus() { return projectStatus; }
    public void setProjectStatus(String projectStatus) { this.projectStatus = projectStatus; }
}
