package com.nexorcrm.backend.dto;

public class StockCategoryResponse {
    private Long id;
    private String name;
    private String fields;
    private java.util.List<Long> allowedVendorTypeIds;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getFields() { return fields; }
    public void setFields(String fields) { this.fields = fields; }
    public java.util.List<Long> getAllowedVendorTypeIds() { return allowedVendorTypeIds; }
    public void setAllowedVendorTypeIds(java.util.List<Long> allowedVendorTypeIds) { this.allowedVendorTypeIds = allowedVendorTypeIds; }
}
