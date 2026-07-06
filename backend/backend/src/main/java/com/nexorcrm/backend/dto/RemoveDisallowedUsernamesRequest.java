package com.nexorcrm.backend.dto;

import java.util.List;

public class RemoveDisallowedUsernamesRequest {
    private List<String> usernames;

    public List<String> getUsernames() {
        return usernames;
    }

    public void setUsernames(List<String> usernames) {
        this.usernames = usernames;
    }
}
