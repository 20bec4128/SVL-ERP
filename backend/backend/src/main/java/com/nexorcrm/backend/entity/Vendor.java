package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vendor")
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vendor_name", nullable = false)
    private String vendorName;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(name = "phone", nullable = false)
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "address")
    private String address;

    @Column(name = "materials_supplied", columnDefinition = "text")
    private String materialsSupplied;

    @Column(name = "country_code")
    private String countryCode;

    @Lob
    @Column(name = "vendor_type_ids", columnDefinition = "text")
    private String vendorTypeIds;

    @Lob
    @Column(name = "product_ids", columnDefinition = "text")
    private String productIds;

    @Lob
    @Column(name = "brand_ids", columnDefinition = "text")
    private String brandIds;

    @Column(name = "deals_with")
    private String dealsWith;

    @Column(name = "internal_representative")
    private String internalRepresentative;

    @Column(name = "relationship_since")
    private java.time.LocalDate relationshipSince;

    @Column(name = "company_website")
    private String companyWebsite;

    @Column(name = "country_of_registration")
    private String countryOfRegistration;

    @Column(name = "company_registration_no")
    private String companyRegistrationNo;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "pan_number")
    private String panNumber;

    @Lob
    @Column(name = "company_address", columnDefinition = "text")
    private String companyAddress;

    @Column(name = "bank_account_holder_name")
    private String bankAccountHolderName;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_account_number")
    private String bankAccountNumber;

    @Column(name = "bank_ifsc_code")
    private String bankIfscCode;

    @Column(name = "bank_branch_name")
    private String bankBranchName;

    @Column(name = "bank_account_type")
    private String bankAccountType;

    @Lob
    @Column(name = "bank_details", columnDefinition = "text")
    private String bankDetails;

    @Column(name = "status")
    private String status = "active";

    @Column(name = "official_email")
    private String officialEmail;

    @Column(name = "secondary_email")
    private String secondaryEmail;

    @Column(name = "username")
    private String username;

    @Column(name = "password_hash")
    private String passwordHash;

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
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getMaterialsSupplied() { return materialsSupplied; }
    public void setMaterialsSupplied(String materialsSupplied) { this.materialsSupplied = materialsSupplied; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getVendorTypeIds() { return vendorTypeIds; }
    public void setVendorTypeIds(String vendorTypeIds) { this.vendorTypeIds = vendorTypeIds; }
    public String getProductIds() { return productIds; }
    public void setProductIds(String productIds) { this.productIds = productIds; }
    public String getBrandIds() { return brandIds; }
    public void setBrandIds(String brandIds) { this.brandIds = brandIds; }
    public String getDealsWith() { return dealsWith; }
    public void setDealsWith(String dealsWith) { this.dealsWith = dealsWith; }
    public String getInternalRepresentative() { return internalRepresentative; }
    public void setInternalRepresentative(String internalRepresentative) { this.internalRepresentative = internalRepresentative; }
    public java.time.LocalDate getRelationshipSince() { return relationshipSince; }
    public void setRelationshipSince(java.time.LocalDate relationshipSince) { this.relationshipSince = relationshipSince; }
    public String getCompanyWebsite() { return companyWebsite; }
    public void setCompanyWebsite(String companyWebsite) { this.companyWebsite = companyWebsite; }
    public String getCountryOfRegistration() { return countryOfRegistration; }
    public void setCountryOfRegistration(String countryOfRegistration) { this.countryOfRegistration = countryOfRegistration; }
    public String getCompanyRegistrationNo() { return companyRegistrationNo; }
    public void setCompanyRegistrationNo(String companyRegistrationNo) { this.companyRegistrationNo = companyRegistrationNo; }
    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }
    public String getCompanyAddress() { return companyAddress; }
    public void setCompanyAddress(String companyAddress) { this.companyAddress = companyAddress; }
    public String getBankAccountHolderName() { return bankAccountHolderName; }
    public void setBankAccountHolderName(String bankAccountHolderName) { this.bankAccountHolderName = bankAccountHolderName; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
    public String getBankIfscCode() { return bankIfscCode; }
    public void setBankIfscCode(String bankIfscCode) { this.bankIfscCode = bankIfscCode; }
    public String getBankBranchName() { return bankBranchName; }
    public void setBankBranchName(String bankBranchName) { this.bankBranchName = bankBranchName; }
    public String getBankAccountType() { return bankAccountType; }
    public void setBankAccountType(String bankAccountType) { this.bankAccountType = bankAccountType; }
    public String getBankDetails() { return bankDetails; }
    public void setBankDetails(String bankDetails) { this.bankDetails = bankDetails; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOfficialEmail() { return officialEmail; }
    public void setOfficialEmail(String officialEmail) { this.officialEmail = officialEmail; }
    public String getSecondaryEmail() { return secondaryEmail; }
    public void setSecondaryEmail(String secondaryEmail) { this.secondaryEmail = secondaryEmail; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
