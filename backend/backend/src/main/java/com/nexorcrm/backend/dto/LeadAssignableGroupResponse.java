package com.nexorcrm.backend.dto;

public class LeadAssignableGroupResponse {
    private Long id;
    private String name;
    private String institutionName;
    private String departmentName;
    private java.util.List<String> teamNames;
    private java.util.List<String> pageKeys;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public java.util.List<String> getTeamNames() {
        return teamNames;
    }

    public void setTeamNames(java.util.List<String> teamNames) {
        this.teamNames = teamNames;
    }

    public java.util.List<String> getPageKeys() {
        return pageKeys;
    }

    public void setPageKeys(java.util.List<String> pageKeys) {
        this.pageKeys = pageKeys;
    }
}
