package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class LeadTypeResponse {
    private Long id;
    private String typeId;
    private String leadType;
    private LocalDateTime createdDate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTypeId() { return typeId; }
    public void setTypeId(String typeId) { this.typeId = typeId; }

    public String getLeadType() { return leadType; }
    public void setLeadType(String leadType) { this.leadType = leadType; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}
