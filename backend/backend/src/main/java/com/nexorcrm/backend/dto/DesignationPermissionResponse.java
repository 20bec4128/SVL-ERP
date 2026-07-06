package com.nexorcrm.backend.dto;

import java.util.List;

public class DesignationPermissionResponse {
    private Long id;
    private String name;
    private Long departmentId;
    private String departmentName;
    private List<String> pageKeys;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    public List<String> getPageKeys() { return pageKeys; }
    public void setPageKeys(List<String> pageKeys) { this.pageKeys = pageKeys; }
}
