package com.nexorcrm.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "leads")
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lead_id", nullable = false, unique = true, length = 64)
    private String leadId;

    @Column(name = "euid", nullable = false)
    private Long euid;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "email", length = 190)
    private String email;

    @Column(name = "email_normalized", length = 190)
    private String emailNormalized;

    @Column(name = "mobile", nullable = false, length = 40)
    private String mobile;

    @Column(name = "mobile_normalized", nullable = false, length = 40)
    private String mobileNormalized;

    @Column(name = "country_code", length = 20)
    private String countryCode;

    @Column(name = "alternate_phone", length = 40)
    private String alternatePhone;

    @Column(name = "alternate_email", length = 190)
    private String alternateEmail;

    @Column(name = "primary_source", nullable = false, length = 160)
    private String primarySource;

    @Column(name = "secondary_source", length = 160)
    private String secondarySource;

    @Column(name = "tertiary_source", length = 160)
    private String tertiarySource;

    @Column(name = "project_name", length = 200)
    private String projectName;

    @Column(name = "occupation", length = 200)
    private String occupation;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "product_type", length = 200)
    private String productType;

    @Column(name = "variant", length = 200)
    private String variant;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "lead_country", length = 100)
    private String leadCountry;

    @Column(name = "lead_state", length = 100)
    private String leadState;

    @Column(name = "lead_city", length = 200)
    private String leadCity;

    @Column(name = "lead_pincode", length = 20)
    private String leadPincode;

    @Column(name = "street_address", length = 500)
    private String streetAddress;

    @Column(name = "gstin", length = 50)
    private String gstin;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "lead_type", length = 160)
    private String leadType;

    @Column(name = "status", nullable = false, length = 100)
    private String status;

    @Column(name = "sv_status", length = 100)
    private String svStatus;

    @Column(name = "owner", nullable = false, length = 120)
    private String owner;

    @Column(name = "assigned_group_id")
    private Long assignedGroupId;

    @Column(name = "allocator_user_id")
    private Long allocatorUserId;

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @Column(name = "follow_up_date")
    private LocalDateTime followUpDate;

    @Column(name = "attempted_open_reason", length = 160)
    private String attemptedOpenReason;

    @Column(name = "attempted_call_status", length = 160)
    private String attemptedCallStatus;

    @Column(name = "attempted_call_remarks", length = 1000)
    private String attemptedCallRemarks;

    @Column(name = "not_attempted_call_status", length = 160)
    private String notAttemptedCallStatus;

    @Column(name = "not_attempted_call_remarks", length = 1000)
    private String notAttemptedCallRemarks;

    @Column(name = "interested_follow_up_date")
    private LocalDateTime interestedFollowUpDate;

    @Column(name = "interested_call_status", length = 160)
    private String interestedCallStatus;

    @Column(name = "interested_call_remarks", length = 1000)
    private String interestedCallRemarks;

    @Column(name = "rejected_reason", length = 200)
    private String rejectedReason;

    @Column(name = "rejected_reason_subtype", length = 500)
    private String rejectedReasonSubtype;

    // payment tracking
    @Column(name = "total_amount", precision = 14, scale = 2)
    private java.math.BigDecimal totalAmount;

    @Column(name = "paid_amount", precision = 14, scale = 2)
    private java.math.BigDecimal paidAmount;

    @Column(name = "remaining_amount", precision = 14, scale = 2)
    private java.math.BigDecimal remainingAmount;

    @Column(name = "design_start_at")
    private LocalDateTime designStartAt;

    @Column(name = "design_end_at")
    private LocalDateTime designEndAt;

    @Column(name = "payment_owner_id")
    private Long paymentOwnerId;

    @Column(name = "design_owner_id")
    private Long designOwnerId;

    @Column(name = "production_owner_id")
    private Long productionOwnerId;

    @Column(name = "pre_deal_owner_user_id")
    private Long preDealOwnerUserId;

    // requirement fields
    @Column(name = "requirement_type", length = 100)
    private String requirementType;

    @Column(name = "requirement_file_name", length = 200)
    private String requirementFileName;

    @Column(name = "requirement_file_path", length = 1000)
    private String requirementFilePath;

    @Column(name = "requirement_file_type", length = 100)
    private String requirementFileType;

    @Column(name = "requirement_file_size")
    private Long requirementFileSize;

    @Column(name = "requirement_notes", columnDefinition = "LONGTEXT")
    private String requirementNotes;

    // payment verification fields
    @Column(name = "payment_proof_file_name", length = 200)
    private String paymentProofFileName;

    @Column(name = "payment_proof_file_path", length = 1000)
    private String paymentProofFilePath;

    @Column(name = "payment_proof_notes", columnDefinition = "LONGTEXT")
    private String paymentProofNotes;

    @Column(name = "payment_verification_status", length = 50)
    private String paymentVerificationStatus;

    @Column(name = "payment_verification_rejection_reason", columnDefinition = "LONGTEXT")
    private String paymentVerificationRejectionReason;

    @Column(name = "payment_verification_billing_address_id")
    private Long paymentVerificationBillingAddressId;

    @Column(name = "payment_verification_shipping_address_id")
    private Long paymentVerificationShippingAddressId;

    @Column(name = "payment_verification_assigned_to_user_id")
    private Long paymentVerificationAssignedToUserId;

    @Column(name = "payment_verification_amount", precision = 14, scale = 2)
    private java.math.BigDecimal paymentVerificationAmount;

    @Column(name = "payment_method", length = 100)
    private String paymentMethod;

    @Column(name = "transaction_id", length = 255)
    private String transactionId;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(name = "payment_notes", columnDefinition = "LONGTEXT")
    private String paymentNotes;

    @Column(name = "rejection_notes", columnDefinition = "LONGTEXT")
    private String rejectionNotes;

    @Column(name = "invoice_data", columnDefinition = "LONGTEXT")
    private String invoiceData;

    @Column(name = "payment_verified_invoice_data", columnDefinition = "LONGTEXT")
    private String paymentVerifiedInvoiceData;

    @Column(name = "invoice_cgst_percent", precision = 5, scale = 2)
    private java.math.BigDecimal invoiceCgstPercent;

    @Column(name = "invoice_sgst_percent", precision = 5, scale = 2)
    private java.math.BigDecimal invoiceSgstPercent;

    @Column(name = "budget_invoice_sent", nullable = false)
    private boolean budgetInvoiceSent = false;

    @Column(name = "payment_invoice_sent", nullable = false)
    private boolean paymentInvoiceSent = false;

    @Column(name = "budget_verification_status", length = 50)
    private String budgetVerificationStatus;

    @Column(name = "budget_verification_assigned_to_user_id")
    private Long budgetVerificationAssignedToUserId;

    @Column(name = "budget_verification_rejection_reason", columnDefinition = "LONGTEXT")
    private String budgetVerificationRejectionReason;

    // ── Duplicate detection fields ──────────────────────────────────────────
    // When is_duplicate = true this lead was created but matched an existing
    // lead by mobile or email. It lives in the "Duplicate" bucket until the
    // user reviews and either converts it to a real lead or discards it.
    @Column(name = "is_duplicate", nullable = false)
    private boolean isDuplicate = false;

    // The ID of the existing lead that this one duplicates.
    @Column(name = "duplicate_of_lead_id")
    private Long duplicateOfLeadId;

    // Human-readable identifier of the original lead (leadId string, e.g. "LD-00042").
    // Stored so the frontend can show it without an extra join.
    @Column(name = "duplicate_of_lead_ref", length = 64)
    private String duplicateOfLeadRef;

    // Display name of the original lead owner — stored for quick display.
    @Column(name = "duplicate_of_lead_name", length = 200)
    private String duplicateOfLeadName;
    // ────────────────────────────────────────────────────────────────────────

    @Column(name = "is_deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null || status.isBlank()) status = "New Lead";
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Getters / Setters ────────────────────────────────────────────────────
    public Long getId() { return id; }
    public String getLeadId() { return leadId; }
    public void setLeadId(String leadId) { this.leadId = leadId; }
    public Long getEuid() { return euid; }
    public void setEuid(Long euid) { this.euid = euid; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getEmailNormalized() { return emailNormalized; }
    public void setEmailNormalized(String emailNormalized) { this.emailNormalized = emailNormalized; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getMobileNormalized() { return mobileNormalized; }
    public void setMobileNormalized(String mobileNormalized) { this.mobileNormalized = mobileNormalized; }
    public String getPrimarySource() { return primarySource; }
    public void setPrimarySource(String primarySource) { this.primarySource = primarySource; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getAlternatePhone() { return alternatePhone; }
    public void setAlternatePhone(String alternatePhone) { this.alternatePhone = alternatePhone; }
    public String getAlternateEmail() { return alternateEmail; }
    public void setAlternateEmail(String alternateEmail) { this.alternateEmail = alternateEmail; }
    public String getSecondarySource() { return secondarySource; }
    public void setSecondarySource(String secondarySource) { this.secondarySource = secondarySource; }
    public String getTertiarySource() { return tertiarySource; }
    public void setTertiarySource(String tertiarySource) { this.tertiarySource = tertiarySource; }
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }
    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
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
    public String getLeadType() { return leadType; }
    public void setLeadType(String leadType) { this.leadType = leadType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSvStatus() { return svStatus; }
    public void setSvStatus(String svStatus) { this.svStatus = svStatus; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public Long getAssignedGroupId() { return assignedGroupId; }
    public void setAssignedGroupId(Long assignedGroupId) { this.assignedGroupId = assignedGroupId; }
    public Long getAllocatorUserId() { return allocatorUserId; }
    public void setAllocatorUserId(Long allocatorUserId) { this.allocatorUserId = allocatorUserId; }
    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }
    public LocalDateTime getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(LocalDateTime followUpDate) { this.followUpDate = followUpDate; }
    public String getAttemptedOpenReason() { return attemptedOpenReason; }
    public void setAttemptedOpenReason(String attemptedOpenReason) { this.attemptedOpenReason = attemptedOpenReason; }
    public String getAttemptedCallStatus() { return attemptedCallStatus; }
    public void setAttemptedCallStatus(String attemptedCallStatus) { this.attemptedCallStatus = attemptedCallStatus; }
    public String getAttemptedCallRemarks() { return attemptedCallRemarks; }
    public void setAttemptedCallRemarks(String attemptedCallRemarks) { this.attemptedCallRemarks = attemptedCallRemarks; }
    public String getNotAttemptedCallStatus() { return notAttemptedCallStatus; }
    public void setNotAttemptedCallStatus(String notAttemptedCallStatus) { this.notAttemptedCallStatus = notAttemptedCallStatus; }
    public String getNotAttemptedCallRemarks() { return notAttemptedCallRemarks; }
    public void setNotAttemptedCallRemarks(String notAttemptedCallRemarks) { this.notAttemptedCallRemarks = notAttemptedCallRemarks; }
    public LocalDateTime getInterestedFollowUpDate() { return interestedFollowUpDate; }
    public void setInterestedFollowUpDate(LocalDateTime interestedFollowUpDate) { this.interestedFollowUpDate = interestedFollowUpDate; }
    public String getInterestedCallStatus() { return interestedCallStatus; }
    public void setInterestedCallStatus(String interestedCallStatus) { this.interestedCallStatus = interestedCallStatus; }
    public String getInterestedCallRemarks() { return interestedCallRemarks; }
    public void setInterestedCallRemarks(String interestedCallRemarks) { this.interestedCallRemarks = interestedCallRemarks; }
    public String getRejectedReason() { return rejectedReason; }
    public void setRejectedReason(String rejectedReason) { this.rejectedReason = rejectedReason; }
    public String getRejectedReasonSubtype() { return rejectedReasonSubtype; }
    public void setRejectedReasonSubtype(String rejectedReasonSubtype) { this.rejectedReasonSubtype = rejectedReasonSubtype; }
    public java.math.BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(java.math.BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public java.math.BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(java.math.BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public java.math.BigDecimal getRemainingAmount() { return remainingAmount; }
    public void setRemainingAmount(java.math.BigDecimal remainingAmount) { this.remainingAmount = remainingAmount; }
    public LocalDateTime getDesignStartAt() { return designStartAt; }
    public void setDesignStartAt(LocalDateTime designStartAt) { this.designStartAt = designStartAt; }
    public LocalDateTime getDesignEndAt() { return designEndAt; }
    public void setDesignEndAt(LocalDateTime designEndAt) { this.designEndAt = designEndAt; }
    public Long getPaymentOwnerId() { return paymentOwnerId; }
    public void setPaymentOwnerId(Long paymentOwnerId) { this.paymentOwnerId = paymentOwnerId; }
    public Long getDesignOwnerId() { return designOwnerId; }
    public void setDesignOwnerId(Long designOwnerId) { this.designOwnerId = designOwnerId; }
    public Long getProductionOwnerId() { return productionOwnerId; }
    public void setProductionOwnerId(Long productionOwnerId) { this.productionOwnerId = productionOwnerId; }
    public Long getPreDealOwnerUserId() { return preDealOwnerUserId; }
    public void setPreDealOwnerUserId(Long preDealOwnerUserId) { this.preDealOwnerUserId = preDealOwnerUserId; }
    public String getRequirementType() { return requirementType; }
    public void setRequirementType(String requirementType) {
        if (requirementType != null && requirementType.length() > 100) {
            this.requirementType = requirementType.substring(0, 97) + "...";
        } else {
            this.requirementType = requirementType;
        }
    }
    public String getRequirementFileName() { return requirementFileName; }
    public void setRequirementFileName(String requirementFileName) { this.requirementFileName = requirementFileName; }
    public String getRequirementFilePath() { return requirementFilePath; }
    public void setRequirementFilePath(String requirementFilePath) { this.requirementFilePath = requirementFilePath; }
    public String getRequirementFileType() { return requirementFileType; }
    public void setRequirementFileType(String requirementFileType) { this.requirementFileType = requirementFileType; }
    public Long getRequirementFileSize() { return requirementFileSize; }
    public void setRequirementFileSize(Long requirementFileSize) { this.requirementFileSize = requirementFileSize; }
    public String getRequirementNotes() { return requirementNotes; }
    public void setRequirementNotes(String requirementNotes) { this.requirementNotes = requirementNotes; }
    public String getPaymentProofFileName() { return paymentProofFileName; }
    public void setPaymentProofFileName(String paymentProofFileName) { this.paymentProofFileName = paymentProofFileName; }
    public String getPaymentProofFilePath() { return paymentProofFilePath; }
    public void setPaymentProofFilePath(String paymentProofFilePath) { this.paymentProofFilePath = paymentProofFilePath; }
    public String getPaymentProofNotes() { return paymentProofNotes; }
    public void setPaymentProofNotes(String paymentProofNotes) { this.paymentProofNotes = paymentProofNotes; }
    public String getPaymentVerificationStatus() { return paymentVerificationStatus; }
    public void setPaymentVerificationStatus(String paymentVerificationStatus) { this.paymentVerificationStatus = paymentVerificationStatus; }
    public String getPaymentVerificationRejectionReason() { return paymentVerificationRejectionReason; }
    public void setPaymentVerificationRejectionReason(String paymentVerificationRejectionReason) { this.paymentVerificationRejectionReason = paymentVerificationRejectionReason; }
    public Long getPaymentVerificationBillingAddressId() { return paymentVerificationBillingAddressId; }
    public void setPaymentVerificationBillingAddressId(Long paymentVerificationBillingAddressId) { this.paymentVerificationBillingAddressId = paymentVerificationBillingAddressId; }
    public Long getPaymentVerificationShippingAddressId() { return paymentVerificationShippingAddressId; }
    public void setPaymentVerificationShippingAddressId(Long paymentVerificationShippingAddressId) { this.paymentVerificationShippingAddressId = paymentVerificationShippingAddressId; }
    public Long getPaymentVerificationAssignedToUserId() { return paymentVerificationAssignedToUserId; }
    public void setPaymentVerificationAssignedToUserId(Long paymentVerificationAssignedToUserId) { this.paymentVerificationAssignedToUserId = paymentVerificationAssignedToUserId; }
    public java.math.BigDecimal getPaymentVerificationAmount() { return paymentVerificationAmount; }
    public void setPaymentVerificationAmount(java.math.BigDecimal paymentVerificationAmount) { this.paymentVerificationAmount = paymentVerificationAmount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }
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
    public boolean isBudgetInvoiceSent() { return budgetInvoiceSent; }
    public void setBudgetInvoiceSent(boolean budgetInvoiceSent) { this.budgetInvoiceSent = budgetInvoiceSent; }
    public boolean isPaymentInvoiceSent() { return paymentInvoiceSent; }
    public void setPaymentInvoiceSent(boolean paymentInvoiceSent) { this.paymentInvoiceSent = paymentInvoiceSent; }
    public String getBudgetVerificationStatus() { return budgetVerificationStatus; }
    public void setBudgetVerificationStatus(String budgetVerificationStatus) { this.budgetVerificationStatus = budgetVerificationStatus; }
    public Long getBudgetVerificationAssignedToUserId() { return budgetVerificationAssignedToUserId; }
    public void setBudgetVerificationAssignedToUserId(Long budgetVerificationAssignedToUserId) { this.budgetVerificationAssignedToUserId = budgetVerificationAssignedToUserId; }
    public String getBudgetVerificationRejectionReason() { return budgetVerificationRejectionReason; }
    public void setBudgetVerificationRejectionReason(String budgetVerificationRejectionReason) { this.budgetVerificationRejectionReason = budgetVerificationRejectionReason; }

    // duplicate detection getters/setters
    public boolean isDuplicate() { return isDuplicate; }
    public void setDuplicate(boolean isDuplicate) { this.isDuplicate = isDuplicate; }
    public Long getDuplicateOfLeadId() { return duplicateOfLeadId; }
    public void setDuplicateOfLeadId(Long duplicateOfLeadId) { this.duplicateOfLeadId = duplicateOfLeadId; }
    public String getDuplicateOfLeadRef() { return duplicateOfLeadRef; }
    public void setDuplicateOfLeadRef(String duplicateOfLeadRef) { this.duplicateOfLeadRef = duplicateOfLeadRef; }
    public String getDuplicateOfLeadName() { return duplicateOfLeadName; }
    public void setDuplicateOfLeadName(String duplicateOfLeadName) { this.duplicateOfLeadName = duplicateOfLeadName; }

    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
}
