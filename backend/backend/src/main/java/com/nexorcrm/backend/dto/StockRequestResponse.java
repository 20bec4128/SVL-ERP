package com.nexorcrm.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StockRequestResponse {
    private Long id;
    private Long dealId;
    private Long leadId;
    private String leadDisplayId;
    private String leadName;
    private Long requestedBy;
    private String requestedByName;
    private Long assignedTo;
    private String assignedToName;
    private String status;
    private String items;
    private BigDecimal purchaseValue;
    private Long vendorId;
    private Boolean budgetExceeded;
    private String billFileName;
    private String billFilePath;
    private String billNote;
    private LocalDateTime billUploadedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getDealId() { return dealId; }
    public void setDealId(Long dealId) { this.dealId = dealId; }
    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }
    public String getLeadDisplayId() { return leadDisplayId; }
    public void setLeadDisplayId(String leadDisplayId) { this.leadDisplayId = leadDisplayId; }
    public String getLeadName() { return leadName; }
    public void setLeadName(String leadName) { this.leadName = leadName; }
    public Long getRequestedBy() { return requestedBy; }
    public void setRequestedBy(Long requestedBy) { this.requestedBy = requestedBy; }
    public String getRequestedByName() { return requestedByName; }
    public void setRequestedByName(String requestedByName) { this.requestedByName = requestedByName; }
    public Long getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Long assignedTo) { this.assignedTo = assignedTo; }
    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }
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
    public String getBillFileName() { return billFileName; }
    public void setBillFileName(String billFileName) { this.billFileName = billFileName; }
    public String getBillFilePath() { return billFilePath; }
    public void setBillFilePath(String billFilePath) { this.billFilePath = billFilePath; }
    public String getBillNote() { return billNote; }
    public void setBillNote(String billNote) { this.billNote = billNote; }
    public LocalDateTime getBillUploadedAt() { return billUploadedAt; }
    public void setBillUploadedAt(LocalDateTime billUploadedAt) { this.billUploadedAt = billUploadedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
