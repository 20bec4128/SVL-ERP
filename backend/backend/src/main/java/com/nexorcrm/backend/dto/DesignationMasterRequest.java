package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class DesignationMasterRequest {

    @NotBlank
    private String name;

    private java.util.List<Long> departmentMasterIds;

    private String status; // ACTIVE / INACTIVE

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public java.util.List<Long> getDepartmentMasterIds() { return departmentMasterIds; }
    public void setDepartmentMasterIds(java.util.List<Long> departmentMasterIds) { this.departmentMasterIds = departmentMasterIds; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
