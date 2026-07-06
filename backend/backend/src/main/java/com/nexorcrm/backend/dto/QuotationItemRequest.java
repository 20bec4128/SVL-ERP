package com.nexorcrm.backend.dto;

import java.math.BigDecimal;

public class QuotationItemRequest {
    private Long requirementId;
    private Long gstMasterId;
    private String productName;
    private String specsSummary;
    private String specsJson;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountPct;
    private BigDecimal gstPct;

    public Long getRequirementId() { return requirementId; }
    public void setRequirementId(Long requirementId) { this.requirementId = requirementId; }
    public Long getGstMasterId() { return gstMasterId; }
    public void setGstMasterId(Long gstMasterId) { this.gstMasterId = gstMasterId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getSpecsSummary() { return specsSummary; }
    public void setSpecsSummary(String specsSummary) { this.specsSummary = specsSummary; }
    public String getSpecsJson() { return specsJson; }
    public void setSpecsJson(String specsJson) { this.specsJson = specsJson; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getDiscountPct() { return discountPct; }
    public void setDiscountPct(BigDecimal discountPct) { this.discountPct = discountPct; }
    public BigDecimal getGstPct() { return gstPct; }
    public void setGstPct(BigDecimal gstPct) { this.gstPct = gstPct; }
}
