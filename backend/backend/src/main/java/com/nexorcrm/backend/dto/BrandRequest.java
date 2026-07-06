package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BrandRequest {
    @NotNull
    private Long stockCategoryId;

    @NotBlank
    private String brandName;

    public Long getStockCategoryId() { return stockCategoryId; }
    public void setStockCategoryId(Long stockCategoryId) { this.stockCategoryId = stockCategoryId; }
    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }
}
