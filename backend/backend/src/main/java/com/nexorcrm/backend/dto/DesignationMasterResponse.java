package com.nexorcrm.backend.dto;

public class DesignationMasterResponse {
    private Long id;
    private String name;
    private java.util.List<Long> departmentMasterIds;
    private java.util.List<String> departmentMasterNames;
    private String status;
    private Long employeeCount; // optional

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public java.util.List<Long> getDepartmentMasterIds() { return departmentMasterIds; }
    public void setDepartmentMasterIds(java.util.List<Long> departmentMasterIds) { this.departmentMasterIds = departmentMasterIds; }

    public java.util.List<String> getDepartmentMasterNames() { return departmentMasterNames; }
    public void setDepartmentMasterNames(java.util.List<String> departmentMasterNames) { this.departmentMasterNames = departmentMasterNames; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getEmployeeCount() { return employeeCount; }
    public void setEmployeeCount(Long employeeCount) { this.employeeCount = employeeCount; }
}
