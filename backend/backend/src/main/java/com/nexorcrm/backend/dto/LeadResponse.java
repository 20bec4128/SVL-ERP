package com.nexorcrm.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class LeadResponse {
    private Long id;
    private String leadId;
    private Long euid;
    private String name;
    private String email;
    private String mobile;
    private String countryCode;
    private String alternatePhone;
    private String alternateEmail;
    private String primarySource;
    private String secondarySource;
    private String tertiarySource;
    private String projectName;
    private String occupation;
    private String companyName;
    private String productType;
    private String variant;
    private Integer quantity;
    private String leadCountry;
    private String leadState;
    private String leadCity;
    private String leadPincode;
    private String streetAddress;
    private Long projectId;
    private String leadType;
    private String status;
    private String svStatus;
    private Long leadGroupId;
    private String leadGroupName;
    private Long allocatorUserId;
    private String allocator;
    private Long ownerUserId;
    private String owner;
    private LocalDateTime followUpDate;
    private String attemptedOpenReason;
    private String attemptedCallStatus;
    private String attemptedCallRemarks;
    private String notAttemptedCallStatus;
    private String notAttemptedCallRemarks;
    private LocalDateTime interestedFollowUpDate;
    private String interestedCallStatus;
    private String interestedCallRemarks;
    private String rejectedReason;
    private String rejectedReasonSubtype;
    private java.math.BigDecimal boqAmount;
    private String boqFileName;
    private String gstin;

    // payment tracking
    private java.math.BigDecimal totalAmount;
    private java.math.BigDecimal paidAmount;
    private java.math.BigDecimal remainingAmount;
    private LocalDateTime designStartAt;
    private LocalDateTime designEndAt;

    // saved owner from payment phase, restored when lead returns to payment
    private Long paymentOwnerId;

    // preserved production owner when lead leaves production; reused when it
    // comes back so the same employee handles the lead every time production
    // status is active
    private Long productionOwnerId;
    private Long preDealOwnerUserId;
    private String boqFilePath;
    private String boqFileType;
    private Long boqFileSize;
    private String boqNotes;
    // requirement fields
    private String requirementType;
    private String requirementFileName;
    private String requirementFilePath;
    private String requirementFileType;
    private Long requirementFileSize;
    private String requirementNotes;

    // payment verification fields
    private String paymentProofFileName;
    private String paymentProofFilePath;
    private String paymentProofNotes;
    private Long paymentVerificationAssignedToUserId;
    private String paymentVerificationAssignedToUserName;
    private String paymentVerificationStatus;
    private String paymentVerificationRejectionReason;

    // payment verification address IDs
    private Long paymentVerificationBillingAddressId;
    private Long paymentVerificationShippingAddressId;

    // payment details & invoice
    private String paymentNotes;
    private String rejectionNotes;
    private String invoiceData;
    private String paymentVerifiedInvoiceData;
    private java.math.BigDecimal invoiceCgstPercent;
    private java.math.BigDecimal invoiceSgstPercent;
    private java.math.BigDecimal paymentVerificationAmount;
    private Boolean budgetInvoiceSent;
    private Boolean paymentInvoiceSent;

    // budget verification fields
    private String budgetVerificationStatus;
    private Long budgetVerificationAssignedToUserId;
    private String budgetVerificationAssignedToUserName;
    private String budgetVerificationRejectionReason;

    // duplicate detection
    @JsonProperty("isDuplicate")
    private boolean isDuplicate;
    private Long duplicateOfLeadId;
    private String duplicateOfLeadRef;
    private String duplicateOfLeadName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getPaymentVerificationAssignedToUserId() {
        return paymentVerificationAssignedToUserId;
    }

    public void setPaymentVerificationAssignedToUserId(Long paymentVerificationAssignedToUserId) {
        this.paymentVerificationAssignedToUserId = paymentVerificationAssignedToUserId;
    }

    public String getPaymentVerificationAssignedToUserName() {
        return paymentVerificationAssignedToUserName;
    }

    public void setPaymentVerificationAssignedToUserName(String paymentVerificationAssignedToUserName) {
        this.paymentVerificationAssignedToUserName = paymentVerificationAssignedToUserName;
    }

    public String getBudgetVerificationStatus() { return budgetVerificationStatus; }
    public void setBudgetVerificationStatus(String budgetVerificationStatus) { this.budgetVerificationStatus = budgetVerificationStatus; }
    public Long getBudgetVerificationAssignedToUserId() { return budgetVerificationAssignedToUserId; }
    public void setBudgetVerificationAssignedToUserId(Long budgetVerificationAssignedToUserId) { this.budgetVerificationAssignedToUserId = budgetVerificationAssignedToUserId; }
    public String getBudgetVerificationAssignedToUserName() { return budgetVerificationAssignedToUserName; }
    public void setBudgetVerificationAssignedToUserName(String budgetVerificationAssignedToUserName) { this.budgetVerificationAssignedToUserName = budgetVerificationAssignedToUserName; }
    public String getBudgetVerificationRejectionReason() { return budgetVerificationRejectionReason; }
    public void setBudgetVerificationRejectionReason(String budgetVerificationRejectionReason) { this.budgetVerificationRejectionReason = budgetVerificationRejectionReason; }
    public boolean isDuplicate() { return isDuplicate; }
    public void setDuplicate(boolean isDuplicate) { this.isDuplicate = isDuplicate; }
    public Long getDuplicateOfLeadId() { return duplicateOfLeadId; }
    public void setDuplicateOfLeadId(Long duplicateOfLeadId) { this.duplicateOfLeadId = duplicateOfLeadId; }
    public String getDuplicateOfLeadRef() { return duplicateOfLeadRef; }
    public void setDuplicateOfLeadRef(String duplicateOfLeadRef) { this.duplicateOfLeadRef = duplicateOfLeadRef; }
    public String getDuplicateOfLeadName() { return duplicateOfLeadName; }
    public void setDuplicateOfLeadName(String duplicateOfLeadName) { this.duplicateOfLeadName = duplicateOfLeadName; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLeadId() {
        return leadId;
    }

    public void setLeadId(String leadId) {
        this.leadId = leadId;
    }

    public Long getEuid() {
        return euid;
    }

    public void setEuid(Long euid) {
        this.euid = euid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getAlternatePhone() {
        return alternatePhone;
    }

    public void setAlternatePhone(String alternatePhone) {
        this.alternatePhone = alternatePhone;
    }

    public String getAlternateEmail() {
        return alternateEmail;
    }

    public void setAlternateEmail(String alternateEmail) {
        this.alternateEmail = alternateEmail;
    }

    public String getPrimarySource() {
        return primarySource;
    }

    public void setPrimarySource(String primarySource) {
        this.primarySource = primarySource;
    }

    public String getSecondarySource() {
        return secondarySource;
    }

    public void setSecondarySource(String secondarySource) {
        this.secondarySource = secondarySource;
    }

    public String getTertiarySource() {
        return tertiarySource;
    }

    public void setTertiarySource(String tertiarySource) {
        this.tertiarySource = tertiarySource;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getOccupation() {
        return occupation;
    }

    public void setOccupation(String occupation) {
        this.occupation = occupation;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
    public String getVariant() { return variant; }
    public void setVariant(String variant) { this.variant = variant; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getLeadCountry() { return leadCountry; }
    public void setLeadCountry(String leadCountry) { this.leadCountry = leadCountry; }
    public String getLeadState() { return leadState; }
    public void setLeadState(String leadState) { this.leadState = leadState; }
    public String getLeadCity() { return leadCity; }
    public void setLeadCity(String leadCity) { this.leadCity = leadCity; }
    public String getLeadPincode() { return leadPincode; }
    public void setLeadPincode(String leadPincode) { this.leadPincode = leadPincode; }
    public String getStreetAddress() { return streetAddress; }
    public void setStreetAddress(String streetAddress) { this.streetAddress = streetAddress; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getLeadType() {
        return leadType;
    }

    public void setLeadType(String leadType) {
        this.leadType = leadType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSvStatus() {
        return svStatus;
    }

    public void setSvStatus(String svStatus) {
        this.svStatus = svStatus;
    }

    public Long getLeadGroupId() {
        return leadGroupId;
    }

    public void setLeadGroupId(Long leadGroupId) {
        this.leadGroupId = leadGroupId;
    }

    public String getLeadGroupName() {
        return leadGroupName;
    }

    public void setLeadGroupName(String leadGroupName) {
        this.leadGroupName = leadGroupName;
    }

    public Long getAllocatorUserId() {
        return allocatorUserId;
    }

    public void setAllocatorUserId(Long allocatorUserId) {
        this.allocatorUserId = allocatorUserId;
    }

    public String getAllocator() {
        return allocator;
    }

    public void setAllocator(String allocator) {
        this.allocator = allocator;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(Long ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public LocalDateTime getFollowUpDate() {
        return followUpDate;
    }

    public void setFollowUpDate(LocalDateTime followUpDate) {
        this.followUpDate = followUpDate;
    }

    public String getAttemptedOpenReason() {
        return attemptedOpenReason;
    }

    public void setAttemptedOpenReason(String attemptedOpenReason) {
        this.attemptedOpenReason = attemptedOpenReason;
    }

    public String getAttemptedCallStatus() {
        return attemptedCallStatus;
    }

    public void setAttemptedCallStatus(String attemptedCallStatus) {
        this.attemptedCallStatus = attemptedCallStatus;
    }

    public String getAttemptedCallRemarks() {
        return attemptedCallRemarks;
    }

    public void setAttemptedCallRemarks(String attemptedCallRemarks) {
        this.attemptedCallRemarks = attemptedCallRemarks;
    }

    public String getNotAttemptedCallStatus() {
        return notAttemptedCallStatus;
    }

    public void setNotAttemptedCallStatus(String notAttemptedCallStatus) {
        this.notAttemptedCallStatus = notAttemptedCallStatus;
    }

    public String getNotAttemptedCallRemarks() {
        return notAttemptedCallRemarks;
    }

    public void setNotAttemptedCallRemarks(String notAttemptedCallRemarks) {
        this.notAttemptedCallRemarks = notAttemptedCallRemarks;
    }

    public LocalDateTime getInterestedFollowUpDate() {
        return interestedFollowUpDate;
    }

    public void setInterestedFollowUpDate(LocalDateTime interestedFollowUpDate) {
        this.interestedFollowUpDate = interestedFollowUpDate;
    }

    public String getInterestedCallStatus() {
        return interestedCallStatus;
    }

    public void setInterestedCallStatus(String interestedCallStatus) {
        this.interestedCallStatus = interestedCallStatus;
    }

    public String getInterestedCallRemarks() {
        return interestedCallRemarks;
    }

    public void setInterestedCallRemarks(String interestedCallRemarks) {
        this.interestedCallRemarks = interestedCallRemarks;
    }

    public String getRejectedReason() {
        return rejectedReason;
    }

    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }

    public String getRejectedReasonSubtype() {
        return rejectedReasonSubtype;
    }

    public void setRejectedReasonSubtype(String rejectedReasonSubtype) {
        this.rejectedReasonSubtype = rejectedReasonSubtype;
    }

    public java.math.BigDecimal getBoqAmount() {
        return boqAmount;
    }

    public void setBoqAmount(java.math.BigDecimal boqAmount) {
        this.boqAmount = boqAmount;
    }

    public String getBoqFileName() {
        return boqFileName;
    }

    public void setBoqFileName(String boqFileName) {
        this.boqFileName = boqFileName;
    }

    public String getBoqFilePath() {
        return boqFilePath;
    }

    public void setBoqFilePath(String boqFilePath) {
        this.boqFilePath = boqFilePath;
    }

    public String getBoqFileType() {
        return boqFileType;
    }

    public void setBoqFileType(String boqFileType) {
        this.boqFileType = boqFileType;
    }

    public Long getBoqFileSize() {
        return boqFileSize;
    }

    public void setBoqFileSize(Long boqFileSize) {
        this.boqFileSize = boqFileSize;
    }

    public String getBoqNotes() {
        return boqNotes;
    }

    public void setBoqNotes(String boqNotes) {
        this.boqNotes = boqNotes;
    }

    public String getRequirementType() {
        return requirementType;
    }

    public void setRequirementType(String requirementType) {
        this.requirementType = requirementType;
    }

    public String getRequirementFileName() {
        return requirementFileName;
    }

    public void setRequirementFileName(String requirementFileName) {
        this.requirementFileName = requirementFileName;
    }

    public String getRequirementFilePath() {
        return requirementFilePath;
    }

    public void setRequirementFilePath(String requirementFilePath) {
        this.requirementFilePath = requirementFilePath;
    }

    public String getRequirementFileType() {
        return requirementFileType;
    }

    public void setRequirementFileType(String requirementFileType) {
        this.requirementFileType = requirementFileType;
    }

    public Long getRequirementFileSize() {
        return requirementFileSize;
    }

    public void setRequirementFileSize(Long requirementFileSize) {
        this.requirementFileSize = requirementFileSize;
    }

    public String getRequirementNotes() {
        return requirementNotes;
    }

    public void setRequirementNotes(String requirementNotes) {
        this.requirementNotes = requirementNotes;
    }

    public String getPaymentProofFileName() {
        return paymentProofFileName;
    }

    public void setPaymentProofFileName(String paymentProofFileName) {
        this.paymentProofFileName = paymentProofFileName;
    }

    public String getPaymentProofFilePath() {
        return paymentProofFilePath;
    }

    public void setPaymentProofFilePath(String paymentProofFilePath) {
        this.paymentProofFilePath = paymentProofFilePath;
    }

    public String getPaymentProofNotes() {
        return paymentProofNotes;
    }

    public void setPaymentProofNotes(String paymentProofNotes) {
        this.paymentProofNotes = paymentProofNotes;
    }

    public String getPaymentVerificationStatus() {
        return paymentVerificationStatus;
    }

    public void setPaymentVerificationStatus(String paymentVerificationStatus) {
        this.paymentVerificationStatus = paymentVerificationStatus;
    }

    public String getPaymentVerificationRejectionReason() {
        return paymentVerificationRejectionReason;
    }

    public void setPaymentVerificationRejectionReason(String paymentVerificationRejectionReason) {
        this.paymentVerificationRejectionReason = paymentVerificationRejectionReason;
    }

    public Long getPaymentVerificationBillingAddressId() {
        return paymentVerificationBillingAddressId;
    }

    public void setPaymentVerificationBillingAddressId(Long paymentVerificationBillingAddressId) {
        this.paymentVerificationBillingAddressId = paymentVerificationBillingAddressId;
    }

    public Long getPaymentVerificationShippingAddressId() {
        return paymentVerificationShippingAddressId;
    }

    public void setPaymentVerificationShippingAddressId(Long paymentVerificationShippingAddressId) {
        this.paymentVerificationShippingAddressId = paymentVerificationShippingAddressId;
    }

    public java.math.BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(java.math.BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public java.math.BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(java.math.BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public java.math.BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(java.math.BigDecimal remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public LocalDateTime getDesignStartAt() {
        return designStartAt;
    }

    public void setDesignStartAt(LocalDateTime designStartAt) {
        this.designStartAt = designStartAt;
    }

    public LocalDateTime getDesignEndAt() {
        return designEndAt;
    }

    public void setDesignEndAt(LocalDateTime designEndAt) {
        this.designEndAt = designEndAt;
    }

    public Long getPaymentOwnerId() {
        return paymentOwnerId;
    }

    public void setPaymentOwnerId(Long paymentOwnerId) {
        this.paymentOwnerId = paymentOwnerId;
    }

    public Long getProductionOwnerId() {
        return productionOwnerId;
    }

    public void setProductionOwnerId(Long productionOwnerId) {
        this.productionOwnerId = productionOwnerId;
    }

    public Long getPreDealOwnerUserId() {
        return preDealOwnerUserId;
    }

    public void setPreDealOwnerUserId(Long preDealOwnerUserId) {
        this.preDealOwnerUserId = preDealOwnerUserId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getPaymentNotes() { return paymentNotes; }
    public void setPaymentNotes(String paymentNotes) { this.paymentNotes = paymentNotes; }

    public String getRejectionNotes() { return rejectionNotes; }
    public void setRejectionNotes(String rejectionNotes) { this.rejectionNotes = rejectionNotes; }

    public String getInvoiceData() { return invoiceData; }
    public void setInvoiceData(String invoiceData) { this.invoiceData = invoiceData; }

    public String getPaymentVerifiedInvoiceData() { return paymentVerifiedInvoiceData; }
    public void setPaymentVerifiedInvoiceData(String paymentVerifiedInvoiceData) { this.paymentVerifiedInvoiceData = paymentVerifiedInvoiceData; }

    public java.math.BigDecimal getInvoiceCgstPercent() { return invoiceCgstPercent; }
    public void setInvoiceCgstPercent(java.math.BigDecimal invoiceCgstPercent) { this.invoiceCgstPercent = invoiceCgstPercent; }

    public java.math.BigDecimal getInvoiceSgstPercent() { return invoiceSgstPercent; }
    public void setInvoiceSgstPercent(java.math.BigDecimal invoiceSgstPercent) { this.invoiceSgstPercent = invoiceSgstPercent; }

    public java.math.BigDecimal getPaymentVerificationAmount() { return paymentVerificationAmount; }
    public void setPaymentVerificationAmount(java.math.BigDecimal paymentVerificationAmount) { this.paymentVerificationAmount = paymentVerificationAmount; }

    public Boolean getBudgetInvoiceSent() { return budgetInvoiceSent; }
    public void setBudgetInvoiceSent(Boolean budgetInvoiceSent) { this.budgetInvoiceSent = budgetInvoiceSent; }

    public Boolean getPaymentInvoiceSent() { return paymentInvoiceSent; }
    public void setPaymentInvoiceSent(Boolean paymentInvoiceSent) { this.paymentInvoiceSent = paymentInvoiceSent; }

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
}
