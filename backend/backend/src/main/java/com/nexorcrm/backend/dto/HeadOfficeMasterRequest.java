package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class HeadOfficeMasterRequest {

    @NotBlank
    private String name;

    private String location;

    private String status; // ACTIVE / INACTIVE

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
