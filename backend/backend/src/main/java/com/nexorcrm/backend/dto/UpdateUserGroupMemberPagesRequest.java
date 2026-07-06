package com.nexorcrm.backend.dto;

import java.util.List;

public class UpdateUserGroupMemberPagesRequest {
    private List<String> pageKeys;

    public List<String> getPageKeys() {
        return pageKeys;
    }

    public void setPageKeys(List<String> pageKeys) {
        this.pageKeys = pageKeys;
    }
}
