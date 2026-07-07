package com.nexorcrm.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class QuotationResponse {
    public static class GstRowResponse {
        private Long gstMasterId;
        private String taxName;
        private BigDecimal taxPercent;

        public Long getGstMasterId() { return gstMasterId; }
        public void setGstMasterId(Long gstMasterId) { this.gstMasterId = gstMasterId; }
        public String getTaxName() { return taxName; }
        public void setTaxName(String taxName) { this.taxName = taxName; }
        public BigDecimal getTaxPercent() { return taxPercent; }
        public void setTaxPercent(BigDecimal taxPercent) { this.taxPercent = taxPercent; }
    }

    private Long id;
    private Long leadId;
    private String quotationNumber;
    private String clientName;
    private String clientMobile;
    private String clientEmail;
    private String clientCompany;
    private String clientAddress;
    private String streetAddress;
    private String clientState;
    private String leadState;
    private String clientGstin;
    private BigDecimal subtotal;
    private BigDecimal discountPercent;
    private BigDecimal gstPercent;
    private BigDecimal gstPctTotal;
    private BigDecimal cgstPct;
    private BigDecimal sgstPct;
    private BigDecimal igstPct;
    private Boolean includeDesignFee;
    private BigDecimal designFeeAmount;
    private BigDecimal designFeeDiscountPct;
    private BigDecimal designFeeGstPct;
    private BigDecimal grandTotal;
    private String notes;
    private LocalDate validityDate;
    private String status;
    private String leadStatus;
    private String salesOrderStatus;
    private Boolean customerExists;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<QuotationItemResponse> items;
    private List<GstRowResponse> gstRows;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public String getStreetAddress() { return streetAddress; }
    public void setStreetAddress(String streetAddress) { this.streetAddress = streetAddress; }
    public String getClientState() { return clientState; }
    public void setClientState(String clientState) { this.clientState = clientState; }
    public String getLeadState() { return leadState; }
    public void setLeadState(String leadState) { this.leadState = leadState; }
    public String getClientGstin() { return clientGstin; }
    public void setClientGstin(String clientGstin) { this.clientGstin = clientGstin; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }
    public BigDecimal getGstPercent() { return gstPercent; }
    public void setGstPercent(BigDecimal gstPercent) { this.gstPercent = gstPercent; }
    public BigDecimal getGstPctTotal() { return gstPctTotal; }
    public void setGstPctTotal(BigDecimal gstPctTotal) { this.gstPctTotal = gstPctTotal; }
    public BigDecimal getCgstPct() { return cgstPct; }
    public void setCgstPct(BigDecimal cgstPct) { this.cgstPct = cgstPct; }
    public BigDecimal getSgstPct() { return sgstPct; }
    public void setSgstPct(BigDecimal sgstPct) { this.sgstPct = sgstPct; }
    public BigDecimal getIgstPct() { return igstPct; }
    public void setIgstPct(BigDecimal igstPct) { this.igstPct = igstPct; }
    public Boolean getIncludeDesignFee() { return includeDesignFee; }
    public void setIncludeDesignFee(Boolean includeDesignFee) { this.includeDesignFee = includeDesignFee; }
    public BigDecimal getDesignFeeAmount() { return designFeeAmount; }
    public void setDesignFeeAmount(BigDecimal designFeeAmount) { this.designFeeAmount = designFeeAmount; }
    public BigDecimal getDesignFeeDiscountPct() { return designFeeDiscountPct; }
    public void setDesignFeeDiscountPct(BigDecimal designFeeDiscountPct) { this.designFeeDiscountPct = designFeeDiscountPct; }
    public BigDecimal getDesignFeeGstPct() { return designFeeGstPct; }
    public void setDesignFeeGstPct(BigDecimal designFeeGstPct) { this.designFeeGstPct = designFeeGstPct; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDate getValidityDate() { return validityDate; }
    public void setValidityDate(LocalDate validityDate) { this.validityDate = validityDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<QuotationItemResponse> getItems() { return items; }
    public void setItems(List<QuotationItemResponse> items) { this.items = items; }
    public List<GstRowResponse> getGstRows() { return gstRows; }
    public void setGstRows(List<GstRowResponse> gstRows) { this.gstRows = gstRows; }

    private Long createdById;
    private String createdByName;
    private String createdByEmail;
    private String createdByRole;
    private String createdByTeam;
    private LocalDateTime verificationRequestedAt;
    private Long verificationRequestedById;
    private String verificationRequestedByName;
    private String verificationRequestedByRole;
    private String verificationRequestNotes;
    private LocalDateTime approvedAt;
    private Long approvedById;
    private String approvedByName;
    private String approvedByRole;
    private String approvalNotes;

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

    public String getLeadStatus() { return leadStatus; }
    public void setLeadStatus(String leadStatus) { this.leadStatus = leadStatus; }
    public String getSalesOrderStatus() { return salesOrderStatus; }
    public void setSalesOrderStatus(String salesOrderStatus) { this.salesOrderStatus = salesOrderStatus; }
    public Boolean getCustomerExists() { return customerExists; }
    public void setCustomerExists(Boolean customerExists) { this.customerExists = customerExists; }
}
