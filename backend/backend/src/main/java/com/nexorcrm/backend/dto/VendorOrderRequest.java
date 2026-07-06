package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class VendorOrderRequest {

    @NotBlank
    private String projectName;
    private Long categoryId;
    private String categoryName;
    private Long typeId;
    private String typeName;
    private Long subtypeId;
    private String subtypeName;
    private String materialName;
    private Long vendorId;
    private String vendorName;
    private String quantity;
    private LocalDate requiredDate;
    private String notes;
    private LocalDate vendorDeadline;
    private String quotationFileName;
    private String status;
    private String paymentStatus;
    private String accountsStatus;
    private String vendorPrice;
    private String advanceAmount;
    private LocalDateTime sentToAccountsAt;
    private LocalDateTime advancePaidAt;
    private LocalDateTime advanceVerifiedAt;
    private String advancePaidNotes;

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public Long getTypeId() { return typeId; }
    public void setTypeId(Long typeId) { this.typeId = typeId; }
    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }
    public Long getSubtypeId() { return subtypeId; }
    public void setSubtypeId(Long subtypeId) { this.subtypeId = subtypeId; }
    public String getSubtypeName() { return subtypeName; }
    public void setSubtypeName(String subtypeName) { this.subtypeName = subtypeName; }
    public String getMaterialName() { return materialName; }
    public void setMaterialName(String materialName) { this.materialName = materialName; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public String getQuantity() { return quantity; }
    public void setQuantity(String quantity) { this.quantity = quantity; }
    public LocalDate getRequiredDate() { return requiredDate; }
    public void setRequiredDate(LocalDate requiredDate) { this.requiredDate = requiredDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDate getVendorDeadline() { return vendorDeadline; }
    public void setVendorDeadline(LocalDate vendorDeadline) { this.vendorDeadline = vendorDeadline; }
    public String getQuotationFileName() { return quotationFileName; }
    public void setQuotationFileName(String quotationFileName) { this.quotationFileName = quotationFileName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getAccountsStatus() { return accountsStatus; }
    public void setAccountsStatus(String accountsStatus) { this.accountsStatus = accountsStatus; }
    public String getVendorPrice() { return vendorPrice; }
    public void setVendorPrice(String vendorPrice) { this.vendorPrice = vendorPrice; }
    public String getAdvanceAmount() { return advanceAmount; }
    public void setAdvanceAmount(String advanceAmount) { this.advanceAmount = advanceAmount; }
    public LocalDateTime getSentToAccountsAt() { return sentToAccountsAt; }
    public void setSentToAccountsAt(LocalDateTime sentToAccountsAt) { this.sentToAccountsAt = sentToAccountsAt; }
    public LocalDateTime getAdvancePaidAt() { return advancePaidAt; }
    public void setAdvancePaidAt(LocalDateTime advancePaidAt) { this.advancePaidAt = advancePaidAt; }
    public LocalDateTime getAdvanceVerifiedAt() { return advanceVerifiedAt; }
    public void setAdvanceVerifiedAt(LocalDateTime advanceVerifiedAt) { this.advanceVerifiedAt = advanceVerifiedAt; }
    public String getAdvancePaidNotes() { return advancePaidNotes; }
    public void setAdvancePaidNotes(String advancePaidNotes) { this.advancePaidNotes = advancePaidNotes; }
}
