package com.nexorcrm.backend.dto;

import java.time.LocalDate;
import java.util.List;

public class VendorResponse {

    private Long id;
    private String vendorName;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String materialsSupplied;
    private String countryCode;
    private String vendorTypeIds;
    private String productIds;
    private String brandIds;
    private String dealsWith;
    private String internalRepresentative;
    private LocalDate relationshipSince;
    private String companyWebsite;
    private String countryOfRegistration;
    private String companyRegistrationNo;
    private String gstNumber;
    private String panNumber;
    private String companyAddress;
    private String status;
    private String bankAccountHolderName;
    private String bankName;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String bankBranchName;
    private String bankAccountType;
    private List<BankDetailDto> bankDetails;
    private String officialEmail;
    private String secondaryEmail;
    private String username;
    private boolean hasPassword;

    // Getters
    public Long getId() { return id; }
    public String getVendorName() { return vendorName; }
    public String getContactPerson() { return contactPerson; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getAddress() { return address; }
    public String getMaterialsSupplied() { return materialsSupplied; }
    public String getCountryCode() { return countryCode; }
    public String getVendorTypeIds() { return vendorTypeIds; }
    public String getProductIds() { return productIds; }
    public String getBrandIds() { return brandIds; }
    public String getDealsWith() { return dealsWith; }
    public String getInternalRepresentative() { return internalRepresentative; }
    public LocalDate getRelationshipSince() { return relationshipSince; }
    public String getCompanyWebsite() { return companyWebsite; }
    public String getCountryOfRegistration() { return countryOfRegistration; }
    public String getCompanyRegistrationNo() { return companyRegistrationNo; }
    public String getGstNumber() { return gstNumber; }
    public String getPanNumber() { return panNumber; }
    public String getCompanyAddress() { return companyAddress; }
    public String getStatus() { return status; }
    public String getBankAccountHolderName() { return bankAccountHolderName; }
    public String getBankName() { return bankName; }
    public String getBankAccountNumber() { return bankAccountNumber; }
    public String getBankIfscCode() { return bankIfscCode; }
    public String getBankBranchName() { return bankBranchName; }
    public String getBankAccountType() { return bankAccountType; }
    public List<BankDetailDto> getBankDetails() { return bankDetails; }
    public String getOfficialEmail() { return officialEmail; }
    public String getSecondaryEmail() { return secondaryEmail; }
    public String getUsername() { return username; }
    public boolean isHasPassword() { return hasPassword; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmail(String email) { this.email = email; }
    public void setAddress(String address) { this.address = address; }
    public void setMaterialsSupplied(String materialsSupplied) { this.materialsSupplied = materialsSupplied; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public void setVendorTypeIds(String vendorTypeIds) { this.vendorTypeIds = vendorTypeIds; }
    public void setProductIds(String productIds) { this.productIds = productIds; }
    public void setBrandIds(String brandIds) { this.brandIds = brandIds; }
    public void setDealsWith(String dealsWith) { this.dealsWith = dealsWith; }
    public void setInternalRepresentative(String internalRepresentative) { this.internalRepresentative = internalRepresentative; }
    public void setRelationshipSince(LocalDate relationshipSince) { this.relationshipSince = relationshipSince; }
    public void setCompanyWebsite(String companyWebsite) { this.companyWebsite = companyWebsite; }
    public void setCountryOfRegistration(String countryOfRegistration) { this.countryOfRegistration = countryOfRegistration; }
    public void setCompanyRegistrationNo(String companyRegistrationNo) { this.companyRegistrationNo = companyRegistrationNo; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }
    public void setCompanyAddress(String companyAddress) { this.companyAddress = companyAddress; }
    public void setStatus(String status) { this.status = status; }
    public void setBankAccountHolderName(String bankAccountHolderName) { this.bankAccountHolderName = bankAccountHolderName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
    public void setBankIfscCode(String bankIfscCode) { this.bankIfscCode = bankIfscCode; }
    public void setBankBranchName(String bankBranchName) { this.bankBranchName = bankBranchName; }
    public void setBankAccountType(String bankAccountType) { this.bankAccountType = bankAccountType; }
    public void setBankDetails(List<BankDetailDto> bankDetails) { this.bankDetails = bankDetails; }
    public void setOfficialEmail(String officialEmail) { this.officialEmail = officialEmail; }
    public void setSecondaryEmail(String secondaryEmail) { this.secondaryEmail = secondaryEmail; }
    public void setUsername(String username) { this.username = username; }
    public void setHasPassword(boolean hasPassword) { this.hasPassword = hasPassword; }
}
