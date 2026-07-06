package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaign_leads")
public class CampaignLead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lead_id", nullable = false, unique = true, length = 64)
    private String leadId;

    @Column(name = "created_time", length = 64)
    private String createdTime;

    @Column(name = "ad_id", length = 64)
    private String adId;

    @Column(name = "ad_name")
    private String adName;

    @Column(name = "adset_id", length = 64)
    private String adsetId;

    @Column(name = "adset_name")
    private String adsetName;

    @Column(name = "campaign_id", length = 64)
    private String campaignId;

    @Column(name = "campaign_name")
    private String campaignName;

    @Column(name = "form_id", length = 64)
    private String formId;

    @Column(name = "form_name")
    private String formName;

    @Column(name = "is_organic", length = 20)
    private String isOrganic;

    @Column(name = "platform", length = 50)
    private String platform;

    @Column(name = "moq")
    private String moq;

    @Column(name = "industry")
    private String industry;

    @Column(name = "email", length = 190)
    private String email;

    @Column(name = "full_name", length = 200)
    private String fullName;

    @Column(name = "phone", length = 40)
    private String phone;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "lead_status", nullable = false, length = 50)
    private String leadStatus = "PENDING"; // PENDING, ASSIGNED

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLeadId() { return leadId; }
    public void setLeadId(String leadId) { this.leadId = leadId; }

    public String getCreatedTime() { return createdTime; }
    public void setCreatedTime(String createdTime) { this.createdTime = createdTime; }

    public String getAdId() { return adId; }
    public void setAdId(String adId) { this.adId = adId; }

    public String getAdName() { return adName; }
    public void setAdName(String adName) { this.adName = adName; }

    public String getAdsetId() { return adsetId; }
    public void setAdsetId(String adsetId) { this.adsetId = adsetId; }

    public String getAdsetName() { return adsetName; }
    public void setAdsetName(String adsetName) { this.adsetName = adsetName; }

    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }

    public String getCampaignName() { return campaignName; }
    public void setCampaignName(String campaignName) { this.campaignName = campaignName; }

    public String getFormId() { return formId; }
    public void setFormId(String formId) { this.formId = formId; }

    public String getFormName() { return formName; }
    public void setFormName(String formName) { this.formName = formName; }

    public String getIsOrganic() { return isOrganic; }
    public void setIsOrganic(String isOrganic) { this.isOrganic = isOrganic; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getMoq() { return moq; }
    public void setMoq(String moq) { this.moq = moq; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getLeadStatus() { return leadStatus; }
    public void setLeadStatus(String leadStatus) { this.leadStatus = leadStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
