package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotNull;

public class StockItemRequest {
    @NotNull
    private Long categoryId;
    private String name;
    @NotNull
    private Integer quantity;
    @NotNull
    private Integer minThreshold;
    private String values; // JSON string
    private Long vendorId;
    private String vendorName;
    private Long brandId;
    private String brandName;

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getMinThreshold() { return minThreshold; }
    public void setMinThreshold(Integer minThreshold) { this.minThreshold = minThreshold; }
    public String getValues() { return values; }
    public void setValues(String values) { this.values = values; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public Long getBrandId() { return brandId; }
    public void setBrandId(Long brandId) { this.brandId = brandId; }
    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }
}