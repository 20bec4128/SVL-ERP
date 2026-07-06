package com.nexorcrm.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DealResponse {
    private Long id;
    private Long sourceLeadId;
    private String name;
    private String email;
    private String mobile;
    private String countryCode;
    private String primarySource;
    private String secondarySource;
    private String tertiarySource;
    private String projectName;
    private String companyName;
    private String owner;
    private Long ownerUserId;
    private Long convertedByUserId;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private String invoiceData;
    private BigDecimal invoiceCgstPercent;
    private BigDecimal invoiceSgstPercent;
    private Boolean budgetInvoiceSent;
    private Boolean paymentInvoiceSent;
    private String status;
    private LocalDateTime convertedAt;
    // alias so the frontend can use createdAt like on LeadResponse
    private LocalDateTime createdAt;
    private Long designAssignedToUserId;
    private String designAssignedToName;
    private String designRequestStatus;
    private String designDraftFileName;
    private String designDraftFilePath;
    private Integer designDraftCount;
    private String designSalesFeedback;
    private String designFinalFileName;
    private String designFinalFilePath;
    private Long productionAssignedToUserId;
    private String productionAssignedToUserName;
    private String productionAssignedToName;
    private String productionWorkStatus;
    private String requirementType;
    private String requirementNotes;
    private String requirementFileName;
    private String requirementFilePath;
    private String artworkFileName;
    private String artworkFilePath;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Boolean getBudgetInvoiceSent() { return budgetInvoiceSent; }
    public void setBudgetInvoiceSent(Boolean budgetInvoiceSent) { this.budgetInvoiceSent = budgetInvoiceSent; }

    public Boolean getPaymentInvoiceSent() { return paymentInvoiceSent; }
    public void setPaymentInvoiceSent(Boolean paymentInvoiceSent) { this.paymentInvoiceSent = paymentInvoiceSent; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getConvertedAt() { return convertedAt; }
    public void setConvertedAt(LocalDateTime convertedAt) {
        this.convertedAt = convertedAt;
        this.createdAt = convertedAt;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Long getDesignAssignedToUserId() { return designAssignedToUserId; }
    public void setDesignAssignedToUserId(Long designAssignedToUserId) { this.designAssignedToUserId = designAssignedToUserId; }

    public String getDesignAssignedToName() { return designAssignedToName; }
    public void setDesignAssignedToName(String designAssignedToName) { this.designAssignedToName = designAssignedToName; }

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

    public String getProductionAssignedToUserName() { return productionAssignedToUserName; }
    public void setProductionAssignedToUserName(String productionAssignedToUserName) { this.productionAssignedToUserName = productionAssignedToUserName; }

    public String getProductionAssignedToName() { return productionAssignedToName; }
    public void setProductionAssignedToName(String productionAssignedToName) { this.productionAssignedToName = productionAssignedToName; }

    public String getProductionWorkStatus() { return productionWorkStatus; }
    public void setProductionWorkStatus(String productionWorkStatus) { this.productionWorkStatus = productionWorkStatus; }

    public String getRequirementType() { return requirementType; }
    public void setRequirementType(String requirementType) { this.requirementType = requirementType; }

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
