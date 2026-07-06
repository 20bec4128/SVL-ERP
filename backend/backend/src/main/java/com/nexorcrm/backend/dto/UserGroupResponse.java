package com.nexorcrm.backend.dto;

public class UserGroupResponse {
    private Long id;
    private String name;
    private long members;
    private boolean canDelete;
    private Long headOfficeId;
    private Long branchId;
    private Long departmentId;
    private java.util.List<Long> departmentIds;
    private String institutionName;
    private String departmentName;
    private java.util.List<String> departmentNames;
    private java.util.List<String> teamNames;
    private java.util.List<String> pageKeys;
    private String memberScope;

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

    public long getMembers() {
        return members;
    }

    public void setMembers(long members) {
        this.members = members;
    }

    public boolean isCanDelete() {
        return canDelete;
    }

    public void setCanDelete(boolean canDelete) {
        this.canDelete = canDelete;
    }

    public Long getHeadOfficeId() {
        return headOfficeId;
    }

    public void setHeadOfficeId(Long headOfficeId) {
        this.headOfficeId = headOfficeId;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public java.util.List<Long> getDepartmentIds() {
        return departmentIds;
    }

    public void setDepartmentIds(java.util.List<Long> departmentIds) {
        this.departmentIds = departmentIds;
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

    public java.util.List<String> getDepartmentNames() {
        return departmentNames;
    }

    public void setDepartmentNames(java.util.List<String> departmentNames) {
        this.departmentNames = departmentNames;
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

    public String getMemberScope() {
        return memberScope;
    }

    public void setMemberScope(String memberScope) {
        this.memberScope = memberScope;
    }
}
