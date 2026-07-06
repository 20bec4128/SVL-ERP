package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quotation_template")
public class QuotationTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "company_tagline", length = 300)
    private String companyTagline;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "phone1", length = 30)
    private String phone1;

    @Column(name = "phone2", length = 30)
    private String phone2;

    @Column(name = "work_phone", length = 30)
    private String workPhone;

    @Column(name = "email", length = 200)
    private String email;

    @Column(name = "website", length = 200)
    private String website;

    @Column(name = "gstin", length = 20)
    private String gstin;

    @Column(name = "state_code", length = 10)
    private String stateCode;

    @Column(name = "state_name", length = 100)
    private String stateName;

    @Column(name = "udyam_number", length = 50)
    private String udyamNumber;

    @Column(name = "logo_base64", columnDefinition = "TEXT")
    private String logoBase64;

    @Column(name = "signature_base64", columnDefinition = "TEXT")
    private String signatureBase64;

    @Column(name = "qr_code_base64", columnDefinition = "TEXT")
    private String qrCodeBase64;

    @Column(name = "watermark_base64", columnDefinition = "TEXT")
    private String watermarkBase64;

    @Column(name = "top_image_base64", columnDefinition = "TEXT")
    private String topImageBase64;

    @Column(name = "bottom_image_base64", columnDefinition = "TEXT")
    private String bottomImageBase64;

    @Column(name = "bank_name", length = 200)
    private String bankName;

    @Column(name = "account_number", length = 30)
    private String accountNumber;

    @Column(name = "ifsc_code", length = 20)
    private String ifscCode;

    @Column(name = "branch", length = 200)
    private String branch;

    @Column(name = "validity_days")
    private Integer validityDays = 30;

    @Column(name = "prepared_by_default", length = 200)
    private String preparedByDefault;

    @Column(name = "approved_by_default", length = 200)
    private String approvedByDefault;

    @Column(name = "policy_text", columnDefinition = "TEXT")
    private String policyText;

    @Column(name = "template_name", length = 200)
    private String templateName;

    @Column(name = "template_variant", length = 30)
    private String templateVariant = "standard";

    @Column(name = "active")
    private Boolean active = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getCompanyTagline() { return companyTagline; }
    public void setCompanyTagline(String companyTagline) { this.companyTagline = companyTagline; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone1() { return phone1; }
    public void setPhone1(String phone1) { this.phone1 = phone1; }

    public String getPhone2() { return phone2; }
    public void setPhone2(String phone2) { this.phone2 = phone2; }

    public String getWorkPhone() { return workPhone; }
    public void setWorkPhone(String workPhone) { this.workPhone = workPhone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }

    public String getStateCode() { return stateCode; }
    public void setStateCode(String stateCode) { this.stateCode = stateCode; }

    public String getStateName() { return stateName; }
    public void setStateName(String stateName) { this.stateName = stateName; }

    public String getUdyamNumber() { return udyamNumber; }
    public void setUdyamNumber(String udyamNumber) { this.udyamNumber = udyamNumber; }

    public String getLogoBase64() { return logoBase64; }
    public void setLogoBase64(String logoBase64) { this.logoBase64 = logoBase64; }

    public String getSignatureBase64() { return signatureBase64; }
    public void setSignatureBase64(String signatureBase64) { this.signatureBase64 = signatureBase64; }

    public String getQrCodeBase64() { return qrCodeBase64; }
    public void setQrCodeBase64(String qrCodeBase64) { this.qrCodeBase64 = qrCodeBase64; }

    public String getWatermarkBase64() { return watermarkBase64; }
    public void setWatermarkBase64(String watermarkBase64) { this.watermarkBase64 = watermarkBase64; }

    public String getTopImageBase64() { return topImageBase64; }
    public void setTopImageBase64(String topImageBase64) { this.topImageBase64 = topImageBase64; }

    public String getBottomImageBase64() { return bottomImageBase64; }
    public void setBottomImageBase64(String bottomImageBase64) { this.bottomImageBase64 = bottomImageBase64; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public Integer getValidityDays() { return validityDays; }
    public void setValidityDays(Integer validityDays) { this.validityDays = validityDays; }

    public String getPreparedByDefault() { return preparedByDefault; }
    public void setPreparedByDefault(String preparedByDefault) { this.preparedByDefault = preparedByDefault; }

    public String getApprovedByDefault() { return approvedByDefault; }
    public void setApprovedByDefault(String approvedByDefault) { this.approvedByDefault = approvedByDefault; }

    public String getPolicyText() { return policyText; }
    public void setPolicyText(String policyText) { this.policyText = policyText; }

    public String getTemplateName() { return templateName; }
    public void setTemplateName(String templateName) { this.templateName = templateName; }

    public String getTemplateVariant() { return templateVariant; }
    public void setTemplateVariant(String templateVariant) { this.templateVariant = templateVariant; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
