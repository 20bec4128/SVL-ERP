package com.nexorcrm.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "deals")
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_lead_id", nullable = false)
    private Long sourceLeadId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "email", length = 190)
    private String email;

    @Column(name = "mobile", length = 40)
    private String mobile;

    @Column(name = "country_code", length = 20)
    private String countryCode;

    @Column(name = "primary_source", length = 160)
    private String primarySource;

    @Column(name = "secondary_source", length = 160)
    private String secondarySource;

    @Column(name = "tertiary_source", length = 160)
    private String tertiarySource;

    @Column(name = "project_name", length = 200)
    private String projectName;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "owner", length = 120)
    private String owner;

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @Column(name = "converted_by_user_id")
    private Long convertedByUserId;

    @Column(name = "total_amount", precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "paid_amount", precision = 14, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "remaining_amount", precision = 14, scale = 2)
    private BigDecimal remainingAmount;

    @Column(name = "invoice_data", columnDefinition = "LONGTEXT")
    private String invoiceData;

    @Column(name = "invoice_cgst_percent", precision = 5, scale = 2)
    private BigDecimal invoiceCgstPercent;

    @Column(name = "invoice_sgst_percent", precision = 5, scale = 2)
    private BigDecimal invoiceSgstPercent;

    @Column(name = "budget_invoice_sent", nullable = false)
    private boolean budgetInvoiceSent = false;

    @Column(name = "payment_invoice_sent", nullable = false)
    private boolean paymentInvoiceSent = false;

    @Column(name = "status", length = 100)
    private String status;

    @Column(name = "converted_at", nullable = false)
    private LocalDateTime convertedAt;

    @Column(name = "requirement_type", length = 100)
    private String requirementType;

    @Column(name = "requirement_notes", columnDefinition = "TEXT")
    private String requirementNotes;

    @Column(name = "requirement_file_name", length = 255)
    private String requirementFileName;

    @Column(name = "requirement_file_path", length = 500)
    private String requirementFilePath;

    @Column(name = "artwork_file_name", length = 255)
    private String artworkFileName;

    @Column(name = "artwork_file_path", length = 500)
    private String artworkFilePath;

    @Column(name = "design_assigned_to_user_id")
    private Long designAssignedToUserId;

    @Column(name = "design_request_status", length = 50)
    private String designRequestStatus;

    @Column(name = "design_draft_file_name", length = 255)
    private String designDraftFileName;

    @Column(name = "design_draft_file_path", length = 500)
    private String designDraftFilePath;

    @Column(name = "design_draft_count")
    private Integer designDraftCount = 0;

    @Column(name = "design_sales_feedback", columnDefinition = "TEXT")
    private String designSalesFeedback;

    @Column(name = "design_final_file_name", length = 255)
    private String designFinalFileName;

    @Column(name = "design_final_file_path", length = 500)
    private String designFinalFilePath;

    @Column(name = "production_assigned_to_user_id")
    private Long productionAssignedToUserId;

    @Column(name = "production_work_status", length = 50)
    private String productionWorkStatus;

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    public Long getId() { return id; }

    public Long getSourceLeadId() { return sourceLeadId; }
    public void setSourceLeadId(Long sourceLeadId) { this.sourceLeadId = sourceLeadId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getPrimarySource() { return primarySource; }
    public void setPrimarySource(String primarySource) { this.primarySource = primarySource; }

    public String getSecondarySource() { return secondarySource; }
    public void setSecondarySource(String secondarySource) { this.secondarySource = secondarySource; }

    public String getTertiarySource() { return tertiarySource; }
    public void setTertiarySource(String tertiarySource) { this.tertiarySource = tertiarySource; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }

    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }

    public Long getConvertedByUserId() { return convertedByUserId; }
    public void setConvertedByUserId(Long convertedByUserId) { this.convertedByUserId = convertedByUserId; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public BigDecimal getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(BigDecimal remainingAmount) { this.remainingAmount = remainingAmount; }

    public String getInvoiceData() { return invoiceData; }
    public void setInvoiceData(String invoiceData) { this.invoiceData = invoiceData; }

    public BigDecimal getInvoiceCgstPercent() { return invoiceCgstPercent; }
    public void setInvoiceCgstPercent(BigDecimal invoiceCgstPercent) { this.invoiceCgstPercent = invoiceCgstPercent; }

    public BigDecimal getInvoiceSgstPercent() { return invoiceSgstPercent; }
    public void setInvoiceSgstPercent(BigDecimal invoiceSgstPercent) { this.invoiceSgstPercent = invoiceSgstPercent; }

    public boolean isBudgetInvoiceSent() { return budgetInvoiceSent; }
    public void setBudgetInvoiceSent(boolean budgetInvoiceSent) { this.budgetInvoiceSent = budgetInvoiceSent; }

    public boolean isPaymentInvoiceSent() { return paymentInvoiceSent; }
    public void setPaymentInvoiceSent(boolean paymentInvoiceSent) { this.paymentInvoiceSent = paymentInvoiceSent; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getConvertedAt() { return convertedAt; }
    public void setConvertedAt(LocalDateTime convertedAt) { this.convertedAt = convertedAt; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }

    public Long getDesignAssignedToUserId() { return designAssignedToUserId; }
    public void setDesignAssignedToUserId(Long designAssignedToUserId) { this.designAssignedToUserId = designAssignedToUserId; }

    public String getDesignRequestStatus() { return designRequestStatus; }
    public void setDesignRequestStatus(String designRequestStatus) { this.designRequestStatus = designRequestStatus; }

    public String getDesignDraftFileName() { return designDraftFileName; }
    public void setDesignDraftFileName(String designDraftFileName) { this.designDraftFileName = designDraftFileName; }

    public String getDesignDraftFilePath() { return designDraftFilePath; }
    public void setDesignDraftFilePath(String designDraftFilePath) { this.designDraftFilePath = designDraftFilePath; }

    public Integer getDesignDraftCount() { return designDraftCount; }
    public void setDesignDraftCount(Integer designDraftCount) { this.designDraftCount = designDraftCount; }

    public String getDesignSalesFeedback() { return designSalesFeedback; }
    public void setDesignSalesFeedback(String designSalesFeedback) { this.designSalesFeedback = designSalesFeedback; }

    public String getDesignFinalFileName() { return designFinalFileName; }
    public void setDesignFinalFileName(String designFinalFileName) { this.designFinalFileName = designFinalFileName; }

    public String getDesignFinalFilePath() { return designFinalFilePath; }
    public void setDesignFinalFilePath(String designFinalFilePath) { this.designFinalFilePath = designFinalFilePath; }

    public Long getProductionAssignedToUserId() { return productionAssignedToUserId; }
    public void setProductionAssignedToUserId(Long productionAssignedToUserId) { this.productionAssignedToUserId = productionAssignedToUserId; }

    public String getProductionWorkStatus() { return productionWorkStatus; }
    public void setProductionWorkStatus(String productionWorkStatus) { this.productionWorkStatus = productionWorkStatus; }

    public String getRequirementType() { return requirementType; }
    public void setRequirementType(String requirementType) {
        if (requirementType != null && requirementType.length() > 100) {
            this.requirementType = requirementType.substring(0, 97) + "...";
        } else {
            this.requirementType = requirementType;
        }
    }

    public String getRequirementNotes() { return requirementNotes; }
    public void setRequirementNotes(String requirementNotes) { this.requirementNotes = requirementNotes; }

    public String getRequirementFileName() { return requirementFileName; }
    public void setRequirementFileName(String requirementFileName) { this.requirementFileName = requirementFileName; }

    public String getRequirementFilePath() { return requirementFilePath; }
    public void setRequirementFilePath(String requirementFilePath) { this.requirementFilePath = requirementFilePath; }

    public String getArtworkFileName() { return artworkFileName; }
    public void setArtworkFileName(String artworkFileName) { this.artworkFileName = artworkFileName; }

    public String getArtworkFilePath() { return artworkFilePath; }
    public void setArtworkFilePath(String artworkFilePath) { this.artworkFilePath = artworkFilePath; }
}
