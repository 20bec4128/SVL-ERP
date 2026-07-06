package com.nexorcrm.backend.dto;

import java.util.List;

public class DepartmentPermissionResponse {
    private Long id;
    private String name;
    private Long branchId;
    private String branchName;
    private List<String> pageKeys;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public List<String> getPageKeys() { return pageKeys; }
    public void setPageKeys(List<String> pageKeys) { this.pageKeys = pageKeys; }
}
