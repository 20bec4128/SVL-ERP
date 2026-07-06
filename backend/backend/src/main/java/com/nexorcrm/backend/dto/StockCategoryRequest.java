package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class StockCategoryRequest {
    @NotBlank
    private String name;

    // JSON representation of fields array
    private String fields;

    // list of vendor type ids permitted for this category
    private java.util.List<Long> allowedVendorTypeIds;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getFields() { return fields; }
    public void setFields(String fields) { this.fields = fields; }
    public java.util.List<Long> getAllowedVendorTypeIds() { return allowedVendorTypeIds; }
    public void setAllowedVendorTypeIds(java.util.List<Long> allowedVendorTypeIds) { this.allowedVendorTypeIds = allowedVendorTypeIds; }
}
