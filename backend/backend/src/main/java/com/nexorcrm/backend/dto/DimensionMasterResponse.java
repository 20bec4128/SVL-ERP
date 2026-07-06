package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.DimensionMaster;

public class DimensionMasterResponse {
    private Long id;
    private String name;

    public DimensionMasterResponse(DimensionMaster d) {
        this.id = d.getId();
        this.name = d.getName();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
