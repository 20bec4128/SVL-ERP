package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class DepartmentMasterRequest {

    @NotBlank
    private String name;

    private java.util.List<Long> branchIds;

    private String status; // ACTIVE / INACTIVE

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public java.util.List<Long> getBranchIds() { return branchIds; }
    public void setBranchIds(java.util.List<Long> branchIds) { this.branchIds = branchIds; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
