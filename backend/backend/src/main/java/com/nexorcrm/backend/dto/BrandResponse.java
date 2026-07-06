package com.nexorcrm.backend.dto;

public class BrandResponse {
    private Long id;
    private Long stockCategoryId;
    private String categoryName;
    private String brandName;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStockCategoryId() { return stockCategoryId; }
    public void setStockCategoryId(Long stockCategoryId) { this.stockCategoryId = stockCategoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public String getBrandName() { return brandName; }
    public void setBrandName(String brandName) { this.brandName = brandName; }
}