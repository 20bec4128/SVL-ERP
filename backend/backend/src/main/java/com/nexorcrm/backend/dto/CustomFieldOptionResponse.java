package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class CustomFieldOptionResponse {

    private Long id;
    private Long typeId;
    private Long subtypeId;
    private String fieldKey;
    private String valueRaw;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTypeId() { return typeId; }
    public void setTypeId(Long typeId) { this.typeId = typeId; }
    public Long getSubtypeId() { return subtypeId; }
    public void setSubtypeId(Long subtypeId) { this.subtypeId = subtypeId; }
    public String getFieldKey() { return fieldKey; }
    public void setFieldKey(String fieldKey) { this.fieldKey = fieldKey; }
    public String getValueRaw() { return valueRaw; }
    public void setValueRaw(String valueRaw) { this.valueRaw = valueRaw; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
