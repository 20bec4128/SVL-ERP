package com.nexorcrm.backend.dto;

public class UserGroupMemberResponse {
    private Long userId;
    private String username;
    private String role;
    private java.util.List<String> pageKeys;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public java.util.List<String> getPageKeys() {
        return pageKeys;
    }

    public void setPageKeys(java.util.List<String> pageKeys) {
        this.pageKeys = pageKeys;
    }
}
