package com.nexorcrm.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LeadCreateRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must be at most 200 characters")
    private String name;

    @Size(max = 190, message = "Email must be at most 190 characters")
    private String email;

    @Size(max = 20, message = "Country Code must be at most 20 characters")
    private String countryCode;

    @NotBlank(message = "Mobile is required")
    @Size(max = 40, message = "Mobile must be at most 40 characters")
    private String mobile;

    @NotBlank(message = "Primary Source is required")
    @Size(max = 160, message = "Primary Source must be at most 160 characters")
    private String primarySource;

    @Size(max = 160, message = "Secondary Source must be at most 160 characters")
    private String secondarySource;

    @Size(max = 160, message = "Tertiary Source must be at most 160 characters")
    private String tertiarySource;

    @Size(max = 200, message = "Company Name must be at most 200 characters")
    private String companyName;

    @Size(max = 200, message = "Product Type must be at most 200 characters")
    private String productType;

    @Size(max = 200, message = "Variant must be at most 200 characters")
    private String variant;

    private Integer quantity;

    @Size(max = 10, message = "Lead Country must be at most 10 characters")
    private String leadCountry;

    @Size(max = 10, message = "Lead State must be at most 10 characters")
    private String leadState;

    @Size(max = 200, message = "Lead City must be at most 200 characters")
    private String leadCity;

    @Size(max = 20, message = "Lead Pincode must be at most 20 characters")
    private String leadPincode;

    @Size(max = 500, message = "Street Address must be at most 500 characters")
    private String streetAddress;

    private Long leadGroupId;

    private Long assignedUserId;

    @Size(max = 50, message = "GSTIN must be at most 50 characters")
    private String gstin;

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

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
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

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getProductType() {
        return productType;
    }

    public void setProductType(String productType) {
        this.productType = productType;
    }

    public String getVariant() {
        return variant;
    }

    public void setVariant(String variant) {
        this.variant = variant;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getLeadCountry() {
        return leadCountry;
    }

    public void setLeadCountry(String leadCountry) {
        this.leadCountry = leadCountry;
    }

    public String getLeadState() {
        return leadState;
    }

    public void setLeadState(String leadState) {
        this.leadState = leadState;
    }

    public String getLeadCity() {
        return leadCity;
    }

    public void setLeadCity(String leadCity) {
        this.leadCity = leadCity;
    }

    public String getLeadPincode() {
        return leadPincode;
    }

    public void setLeadPincode(String leadPincode) {
        this.leadPincode = leadPincode;
    }

    public Long getLeadGroupId() {
        return leadGroupId;
    }

    public void setLeadGroupId(Long leadGroupId) {
        this.leadGroupId = leadGroupId;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
    }

    public Long getAssignedUserId() { return assignedUserId; }
    public void setAssignedUserId(Long assignedUserId) { this.assignedUserId = assignedUserId; }

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }

    @JsonProperty("isDuplicate")
    private boolean isDuplicate = false;
    private Long duplicateOfLeadId;
    private String duplicateOfLeadRef;
    private String duplicateOfLeadName;

    public boolean isDuplicate() { return isDuplicate; }
    public void setDuplicate(boolean isDuplicate) { this.isDuplicate = isDuplicate; }
    public Long getDuplicateOfLeadId() { return duplicateOfLeadId; }
    public void setDuplicateOfLeadId(Long duplicateOfLeadId) { this.duplicateOfLeadId = duplicateOfLeadId; }
    public String getDuplicateOfLeadRef() { return duplicateOfLeadRef; }
    public void setDuplicateOfLeadRef(String duplicateOfLeadRef) { this.duplicateOfLeadRef = duplicateOfLeadRef; }
    public String getDuplicateOfLeadName() { return duplicateOfLeadName; }
    public void setDuplicateOfLeadName(String duplicateOfLeadName) { this.duplicateOfLeadName = duplicateOfLeadName; }
}
