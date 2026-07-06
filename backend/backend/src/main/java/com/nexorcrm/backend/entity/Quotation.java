package com.nexorcrm.backend.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quotations")
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lead_id")
    private Long leadId;

    @Column(name = "quotation_number", nullable = false, unique = true, length = 50)
    private String quotationNumber;

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "client_mobile", length = 50)
    private String clientMobile;

    @Column(name = "client_email")
    private String clientEmail;

    @Column(name = "client_company")
    private String clientCompany;

    @Column(name = "client_address", length = 500)
    private String clientAddress;

    @Column(name = "client_state", length = 100)
    private String clientState;

    @Column(name = "subtotal", precision = 12, scale = 2, nullable = false)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_percent", precision = 5, scale = 2, nullable = false)
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(name = "gst_percent", precision = 5, scale = 2, nullable = false)
    private BigDecimal gstPercent = new BigDecimal("18");

    @Column(name = "cgst_percent", precision = 6, scale = 2)
    private BigDecimal cgstPercent = BigDecimal.ZERO;

    @Column(name = "sgst_percent", precision = 6, scale = 2)
    private BigDecimal sgstPercent = BigDecimal.ZERO;

    @Column(name = "igst_percent", precision = 6, scale = 2)
    private BigDecimal igstPercent = BigDecimal.ZERO;

    @Column(name = "include_design_fee", nullable = false)
    private boolean includeDesignFee = false;

    @Column(name = "design_fee_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal designFeeAmount = BigDecimal.ZERO;

    @Column(name = "design_fee_discount_percent", precision = 5, scale = 2, nullable = false)
    private BigDecimal designFeeDiscountPercent = BigDecimal.ZERO;

    @Column(name = "design_fee_gst_percent", precision = 5, scale = 2, nullable = false)
    private BigDecimal designFeeGstPercent = BigDecimal.ZERO;

    @Column(name = "gst_rows_json", columnDefinition = "TEXT")
    private String gstRowsJson;

    @Column(name = "grand_total", precision = 12, scale = 2, nullable = false)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @Column(name = "validity_date")
    private LocalDate validityDate;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "draft";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by_id")
    private Long createdById;

    @Column(name = "created_by_name", length = 255)
    private String createdByName;

    @Column(name = "created_by_email", length = 255)
    private String createdByEmail;

    @Column(name = "created_by_role", length = 40)
    private String createdByRole;

    @Column(name = "created_by_team", length = 160)
    private String createdByTeam;

    @Column(name = "verification_requested_at")
    private LocalDateTime verificationRequestedAt;

    @Column(name = "verification_requested_by_id")
    private Long verificationRequestedById;

    @Column(name = "verification_requested_by_name", length = 255)
    private String verificationRequestedByName;

    @Column(name = "verification_requested_by_role", length = 40)
    private String verificationRequestedByRole;

    @Column(name = "verification_request_notes", columnDefinition = "TEXT")
    private String verificationRequestNotes;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by_id")
    private Long approvedById;

    @Column(name = "approved_by_name", length = 255)
    private String approvedByName;

    @Column(name = "approved_by_role", length = 40)
    private String approvedByRole;

    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuotationItem> items = new ArrayList<>();

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }
    public String getQuotationNumber() { return quotationNumber; }
    public void setQuotationNumber(String quotationNumber) { this.quotationNumber = quotationNumber; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getClientMobile() { return clientMobile; }
    public void setClientMobile(String clientMobile) { this.clientMobile = clientMobile; }
    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }
    public String getClientCompany() { return clientCompany; }
    public void setClientCompany(String clientCompany) { this.clientCompany = clientCompany; }
    public String getClientAddress() { return clientAddress; }
    public void setClientAddress(String clientAddress) { this.clientAddress = clientAddress; }
    public String getClientState() { return clientState; }
    public void setClientState(String clientState) { this.clientState = clientState; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }
    public BigDecimal getGstPercent() { return gstPercent; }
    public void setGstPercent(BigDecimal gstPercent) { this.gstPercent = gstPercent; }
    public BigDecimal getCgstPercent() { return cgstPercent; }
    public void setCgstPercent(BigDecimal cgstPercent) { this.cgstPercent = cgstPercent; }
    public BigDecimal getSgstPercent() { return sgstPercent; }
    public void setSgstPercent(BigDecimal sgstPercent) { this.sgstPercent = sgstPercent; }
    public BigDecimal getIgstPercent() { return igstPercent; }
    public void setIgstPercent(BigDecimal igstPercent) { this.igstPercent = igstPercent; }
    public boolean isIncludeDesignFee() { return includeDesignFee; }
    public void setIncludeDesignFee(boolean includeDesignFee) { this.includeDesignFee = includeDesignFee; }
    public BigDecimal getDesignFeeAmount() { return designFeeAmount; }
    public void setDesignFeeAmount(BigDecimal designFeeAmount) { this.designFeeAmount = designFeeAmount; }
    public BigDecimal getDesignFeeDiscountPercent() { return designFeeDiscountPercent; }
    public void setDesignFeeDiscountPercent(BigDecimal designFeeDiscountPercent) { this.designFeeDiscountPercent = designFeeDiscountPercent; }
    public BigDecimal getDesignFeeGstPercent() { return designFeeGstPercent; }
    public void setDesignFeeGstPercent(BigDecimal designFeeGstPercent) { this.designFeeGstPercent = designFeeGstPercent; }
    public String getGstRowsJson() { return gstRowsJson; }
    public void setGstRowsJson(String gstRowsJson) { this.gstRowsJson = gstRowsJson; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDate getValidityDate() { return validityDate; }
    public void setValidityDate(LocalDate validityDate) { this.validityDate = validityDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public String getCreatedByEmail() { return createdByEmail; }
    public void setCreatedByEmail(String createdByEmail) { this.createdByEmail = createdByEmail; }
    public String getCreatedByRole() { return createdByRole; }
    public void setCreatedByRole(String createdByRole) { this.createdByRole = createdByRole; }
    public String getCreatedByTeam() { return createdByTeam; }
    public void setCreatedByTeam(String createdByTeam) { this.createdByTeam = createdByTeam; }
    public LocalDateTime getVerificationRequestedAt() { return verificationRequestedAt; }
    public void setVerificationRequestedAt(LocalDateTime v) { this.verificationRequestedAt = v; }
    public Long getVerificationRequestedById() { return verificationRequestedById; }
    public void setVerificationRequestedById(Long v) { this.verificationRequestedById = v; }
    public String getVerificationRequestedByName() { return verificationRequestedByName; }
    public void setVerificationRequestedByName(String v) { this.verificationRequestedByName = v; }
    public String getVerificationRequestedByRole() { return verificationRequestedByRole; }
    public void setVerificationRequestedByRole(String v) { this.verificationRequestedByRole = v; }
    public String getVerificationRequestNotes() { return verificationRequestNotes; }
    public void setVerificationRequestNotes(String v) { this.verificationRequestNotes = v; }
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    public Long getApprovedById() { return approvedById; }
    public void setApprovedById(Long approvedById) { this.approvedById = approvedById; }
    public String getApprovedByName() { return approvedByName; }
    public void setApprovedByName(String approvedByName) { this.approvedByName = approvedByName; }
    public String getApprovedByRole() { return approvedByRole; }
    public void setApprovedByRole(String approvedByRole) { this.approvedByRole = approvedByRole; }
    public String getApprovalNotes() { return approvalNotes; }
    public void setApprovalNotes(String approvalNotes) { this.approvalNotes = approvalNotes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<QuotationItem> getItems() { return items; }
    public void setItems(List<QuotationItem> items) { this.items = items; }
}
