package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.GstMaster;

import java.math.BigDecimal;

public class GstMasterResponse {
    private Long id;
    private String taxName;
    private BigDecimal taxPercent;
    private String taxType;
    private Boolean isActive;

    public GstMasterResponse(GstMaster entity) {
        this.id = entity.getId();
        this.taxName = entity.getTaxName();
        this.taxPercent = entity.getTaxPercent();
        this.taxType = entity.getTaxType();
        this.isActive = entity.getIsActive();
    }

    public Long getId() { return id; }
    public String getTaxName() { return taxName; }
    public BigDecimal getTaxPercent() { return taxPercent; }
    public String getTaxType() { return taxType; }
    public Boolean getIsActive() { return isActive; }
}
