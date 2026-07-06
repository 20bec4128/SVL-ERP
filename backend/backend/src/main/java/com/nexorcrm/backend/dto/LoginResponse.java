package com.nexorcrm.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String role;
    private String institution;
    private String departmentName;
    private String team;
    private boolean forcePasswordChange;
    @JsonProperty("isProfileIncomplete")
    private boolean profileIncomplete;

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getTeam() {
        return team;
    }

    public void setTeam(String team) {
        this.team = team;
    }

    public boolean isForcePasswordChange() {
        return forcePasswordChange;
    }

    public void setForcePasswordChange(boolean forcePasswordChange) {
        this.forcePasswordChange = forcePasswordChange;
    }

    public boolean isProfileIncomplete() {
        return profileIncomplete;
    }

    public void setProfileIncomplete(boolean profileIncomplete) {
        this.profileIncomplete = profileIncomplete;
    }
}
