package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.UnitMaster;

public class UnitMasterResponse {
    private Long id;
    private String name;

    public UnitMasterResponse(UnitMaster u) {
        this.id = u.getId();
        this.name = u.getName();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
