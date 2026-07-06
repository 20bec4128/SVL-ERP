package com.nexorcrm.backend.dto;

public class CustomFieldOptionRequest {

    private Long typeId;
    private Long subtypeId;
    private String fieldKey;
    private String valueRaw;

    public Long getTypeId() { return typeId; }
    public void setTypeId(Long typeId) { this.typeId = typeId; }
    public Long getSubtypeId() { return subtypeId; }
    public void setSubtypeId(Long subtypeId) { this.subtypeId = subtypeId; }
    public String getFieldKey() { return fieldKey; }
    public void setFieldKey(String fieldKey) { this.fieldKey = fieldKey; }
    public String getValueRaw() { return valueRaw; }
    public void setValueRaw(String valueRaw) { this.valueRaw = valueRaw; }
}
