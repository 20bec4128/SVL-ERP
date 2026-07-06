package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.CampaignLead;

import java.time.LocalDateTime;

public class CampaignLeadResponse {
    private Long id;
    private String leadId;
    private String createdTime;
    private String adName;
    private String campaignName;
    private String formName;
    private String platform;
    private String moq;
    private String industry;
    private String email;
    private String fullName;
    private String phone;
    private String city;
    private String leadStatus;
    private LocalDateTime createdAt;

    public CampaignLeadResponse(CampaignLead lead) {
        this.id = lead.getId();
        this.leadId = lead.getLeadId();
        this.createdTime = lead.getCreatedTime();
        this.adName = lead.getAdName();
        this.campaignName = lead.getCampaignName();
        this.formName = lead.getFormName();
        this.platform = lead.getPlatform();
        this.moq = lead.getMoq();
        this.industry = lead.getIndustry();
        this.email = lead.getEmail();
        this.fullName = lead.getFullName();
        this.phone = lead.getPhone();
        this.city = lead.getCity();
        this.leadStatus = lead.getLeadStatus();
        this.createdAt = lead.getCreatedAt();
    }

    public Long getId() { return id; }
    public String getLeadId() { return leadId; }
    public String getCreatedTime() { return createdTime; }
    public String getAdName() { return adName; }
    public String getCampaignName() { return campaignName; }
    public String getFormName() { return formName; }
    public String getPlatform() { return platform; }
    public String getMoq() { return moq; }
    public String getIndustry() { return industry; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPhone() { return phone; }
    public String getCity() { return city; }
    public String getLeadStatus() { return leadStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
