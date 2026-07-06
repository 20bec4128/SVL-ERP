package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payslip_template")
public class PayslipTemplate {

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

    @Column(name = "udyam_number", length = 50)
    private String udyamNumber;

    @Column(name = "logo_base64", columnDefinition = "TEXT")
    private String logoBase64;

    @Column(name = "top_image_base64", columnDefinition = "TEXT")
    private String topImageBase64;

    @Column(name = "bottom_image_base64", columnDefinition = "TEXT")
    private String bottomImageBase64;

    @Column(name = "signature_base64", columnDefinition = "TEXT")
    private String signatureBase64;

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

    public String getUdyamNumber() { return udyamNumber; }
    public void setUdyamNumber(String udyamNumber) { this.udyamNumber = udyamNumber; }

    public String getLogoBase64() { return logoBase64; }
    public void setLogoBase64(String logoBase64) { this.logoBase64 = logoBase64; }

    public String getTopImageBase64() { return topImageBase64; }
    public void setTopImageBase64(String topImageBase64) { this.topImageBase64 = topImageBase64; }

    public String getBottomImageBase64() { return bottomImageBase64; }
    public void setBottomImageBase64(String bottomImageBase64) { this.bottomImageBase64 = bottomImageBase64; }

    public String getSignatureBase64() { return signatureBase64; }
    public void setSignatureBase64(String signatureBase64) { this.signatureBase64 = signatureBase64; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
