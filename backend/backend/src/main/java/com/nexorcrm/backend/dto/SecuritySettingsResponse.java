package com.nexorcrm.backend.dto;

import java.util.List;

public class SecuritySettingsResponse {
    private List<String> disallowedUsernames;
    private List<String> bannedIps;

    public List<String> getDisallowedUsernames() {
        return disallowedUsernames;
    }

    public void setDisallowedUsernames(List<String> disallowedUsernames) {
        this.disallowedUsernames = disallowedUsernames;
    }

    public List<String> getBannedIps() {
        return bannedIps;
    }

    public void setBannedIps(List<String> bannedIps) {
        this.bannedIps = bannedIps;
    }
}
