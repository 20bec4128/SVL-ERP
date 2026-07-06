package com.nexorcrm.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_order")
public class VendorOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "category_name")
    private String categoryName;

    @Column(name = "type_id")
    private Long typeId;

    @Column(name = "type_name")
    private String typeName;

    @Column(name = "subtype_id")
    private Long subtypeId;

    @Column(name = "subtype_name")
    private String subtypeName;

    @Column(name = "material_name")
    private String materialName;

    @Column(name = "vendor_id")
    private Long vendorId;

    @Column(name = "vendor_name")
    private String vendorName;

    @Column(name = "quantity")
    private String quantity;

    @Column(name = "required_date")
    private LocalDate requiredDate;

    @Lob
    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @Column(name = "upload_design_path")
    private String uploadDesignPath;

    @Column(name = "vendor_deadline")
    private LocalDate vendorDeadline;

    @Column(name = "quotation_file_name")
    private String quotationFileName;

    @Column(name = "quotation_file_path")
    private String quotationFilePath;

    @Column(name = "status", nullable = false)
    private String status = "New";

    @Column(name = "payment_status", nullable = false)
    private String paymentStatus = "Pending";

    @Column(name = "accounts_status", nullable = false)
    private String accountsStatus = "Not Sent";

    @Column(name = "vendor_price")
    private String vendorPrice;

    @Column(name = "advance_amount")
    private String advanceAmount;

    @Column(name = "sent_to_accounts_at")
    private LocalDateTime sentToAccountsAt;

    @Column(name = "advance_paid_at")
    private LocalDateTime advancePaidAt;

    @Column(name = "advance_verified_at")
    private LocalDateTime advanceVerifiedAt;

    @Column(name = "advance_paid_proof_name")
    private String advancePaidProofName;

    @Column(name = "advance_paid_proof_path")
    private String advancePaidProofPath;

    @Lob
    @Column(name = "advance_paid_notes", columnDefinition = "text")
    private String advancePaidNotes;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
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
    public String getUploadDesignPath() { return uploadDesignPath; }
    public void setUploadDesignPath(String uploadDesignPath) { this.uploadDesignPath = uploadDesignPath; }
    public LocalDate getVendorDeadline() { return vendorDeadline; }
    public void setVendorDeadline(LocalDate vendorDeadline) { this.vendorDeadline = vendorDeadline; }
    public String getQuotationFileName() { return quotationFileName; }
    public void setQuotationFileName(String quotationFileName) { this.quotationFileName = quotationFileName; }
    public String getQuotationFilePath() { return quotationFilePath; }
    public void setQuotationFilePath(String quotationFilePath) { this.quotationFilePath = quotationFilePath; }
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
    public String getAdvancePaidProofName() { return advancePaidProofName; }
    public void setAdvancePaidProofName(String advancePaidProofName) { this.advancePaidProofName = advancePaidProofName; }
    public String getAdvancePaidProofPath() { return advancePaidProofPath; }
    public void setAdvancePaidProofPath(String advancePaidProofPath) { this.advancePaidProofPath = advancePaidProofPath; }
    public String getAdvancePaidNotes() { return advancePaidNotes; }
    public void setAdvancePaidNotes(String advancePaidNotes) { this.advancePaidNotes = advancePaidNotes; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
