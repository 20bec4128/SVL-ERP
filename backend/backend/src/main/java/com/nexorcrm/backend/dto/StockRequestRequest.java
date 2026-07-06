package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class StockRequestRequest {
    private Long dealId;
    private Long leadId;
    private Long requestedBy;
    private Long assignedTo;
    private String status;
    private String items; // JSON text
    private BigDecimal purchaseValue;
    private Long vendorId;
    private Boolean budgetExceeded;

    public Long getDealId() { return dealId; }
    public void setDealId(Long dealId) { this.dealId = dealId; }
    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }
    public Long getRequestedBy() { return requestedBy; }
    public void setRequestedBy(Long requestedBy) { this.requestedBy = requestedBy; }
    public Long getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Long assignedTo) { this.assignedTo = assignedTo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getItems() { return items; }
    public void setItems(String items) { this.items = items; }
    public BigDecimal getPurchaseValue() { return purchaseValue; }
    public void setPurchaseValue(BigDecimal purchaseValue) { this.purchaseValue = purchaseValue; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public Boolean getBudgetExceeded() { return budgetExceeded; }
    public void setBudgetExceeded(Boolean budgetExceeded) { this.budgetExceeded = budgetExceeded; }
}
