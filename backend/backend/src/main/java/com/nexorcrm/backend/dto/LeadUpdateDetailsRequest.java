package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class LeadUpdateDetailsRequest {
    private String alternatePhone;
    private String alternateEmail;
    private String countryCode;
    private LocalDateTime followUpDate;
    private String companyName;
    private String leadType;
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

    // payment tracking
    private java.math.BigDecimal totalAmount;
    private java.math.BigDecimal paidAmount;
    private java.math.BigDecimal remainingAmount;
    private LocalDateTime designStartAt;
    private LocalDateTime designEndAt;

    // used by frontend to persist payment-owner reference
    private Long paymentOwnerId;

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
    private String paymentVerificationStatus;
    private String paymentVerificationRejectionReason;

    // payment verification address IDs
    private Long paymentVerificationAssignedToUserId;
    private Long paymentVerificationBillingAddressId;
    private Long paymentVerificationShippingAddressId;

    // payment details captured from payment verification
    private String paymentMethod;
    private String transactionId;
    private LocalDateTime paymentDate;
    private String paymentNotes;
    private String rejectionNotes;
    private String invoiceData;
    private String paymentVerifiedInvoiceData;
    private String paymentVerificationInvoiceFileName;
    private String paymentVerificationInvoiceFilePath;
    private String budgetInvoiceFileName;
    private String budgetInvoiceFilePath;
    private java.math.BigDecimal invoiceCgstPercent;
    private java.math.BigDecimal invoiceSgstPercent;
    private java.math.BigDecimal paymentVerificationAmount;
    private Boolean budgetInvoiceSent;
    private Boolean paymentInvoiceSent;

    // budget verification fields
    private String budgetVerificationStatus;
    private Long budgetVerificationAssignedToUserId;
    private String budgetVerificationRejectionReason;

    private String email;
    private String mobile;
    private String primarySource;
    private String secondarySource;
    private String productType;
    private String variant;
    private Integer quantity;
    private String leadCountry;
    private String leadState;
    private String leadCity;
    private String leadPincode;
    private String streetAddress;
    private String gstin;

    // production requirement - JSON serialized production brief
    private String productionBrief;

    // design requirement - JSON serialized design brief
    private String designBrief;

    public String getBudgetVerificationStatus() { return budgetVerificationStatus; }
    public void setBudgetVerificationStatus(String s) { this.budgetVerificationStatus = s; }
    public Long getBudgetVerificationAssignedToUserId() { return budgetVerificationAssignedToUserId; }
    public void setBudgetVerificationAssignedToUserId(Long id) { this.budgetVerificationAssignedToUserId = id; }
    public String getBudgetVerificationRejectionReason() { return budgetVerificationRejectionReason; }
    public void setBudgetVerificationRejectionReason(String s) { this.budgetVerificationRejectionReason = s; }

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

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public LocalDateTime getFollowUpDate() {
        return followUpDate;
    }

    public void setFollowUpDate(LocalDateTime followUpDate) {
        this.followUpDate = followUpDate;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getLeadType() {
        return leadType;
    }

    public void setLeadType(String leadType) {
        this.leadType = leadType;
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

 

    public Long getPaymentVerificationAssignedToUserId() {
        return paymentVerificationAssignedToUserId;
    }

    public void setPaymentVerificationAssignedToUserId(Long paymentVerificationAssignedToUserId) {
        this.paymentVerificationAssignedToUserId = paymentVerificationAssignedToUserId;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getPaymentNotes() {
        return paymentNotes;
    }

    public void setPaymentNotes(String paymentNotes) {
        this.paymentNotes = paymentNotes;
    }

    public String getRejectionNotes() {
        return rejectionNotes;
    }

    public void setRejectionNotes(String rejectionNotes) {
        this.rejectionNotes = rejectionNotes;
    }

    public String getInvoiceData() {
        return invoiceData;
    }

    public void setInvoiceData(String invoiceData) {
        this.invoiceData = invoiceData;
    }

    public String getPaymentVerifiedInvoiceData() { return paymentVerifiedInvoiceData; }
    public void setPaymentVerifiedInvoiceData(String paymentVerifiedInvoiceData) { this.paymentVerifiedInvoiceData = paymentVerifiedInvoiceData; }

    public String getPaymentVerificationInvoiceFileName() { return paymentVerificationInvoiceFileName; }
    public void setPaymentVerificationInvoiceFileName(String paymentVerificationInvoiceFileName) { this.paymentVerificationInvoiceFileName = paymentVerificationInvoiceFileName; }

    public String getPaymentVerificationInvoiceFilePath() { return paymentVerificationInvoiceFilePath; }
    public void setPaymentVerificationInvoiceFilePath(String paymentVerificationInvoiceFilePath) { this.paymentVerificationInvoiceFilePath = paymentVerificationInvoiceFilePath; }

    public String getBudgetInvoiceFileName() { return budgetInvoiceFileName; }
    public void setBudgetInvoiceFileName(String budgetInvoiceFileName) { this.budgetInvoiceFileName = budgetInvoiceFileName; }

    public String getBudgetInvoiceFilePath() { return budgetInvoiceFilePath; }
    public void setBudgetInvoiceFilePath(String budgetInvoiceFilePath) { this.budgetInvoiceFilePath = budgetInvoiceFilePath; }

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

    public String getProductionBrief() { return productionBrief; }
    public void setProductionBrief(String productionBrief) { this.productionBrief = productionBrief; }

    public String getDesignBrief() { return designBrief; }
    public void setDesignBrief(String designBrief) { this.designBrief = designBrief; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getPrimarySource() { return primarySource; }
    public void setPrimarySource(String primarySource) { this.primarySource = primarySource; }
    public String getSecondarySource() { return secondarySource; }
    public void setSecondarySource(String secondarySource) { this.secondarySource = secondarySource; }
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

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
}
