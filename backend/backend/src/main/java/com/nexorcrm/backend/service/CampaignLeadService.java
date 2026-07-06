package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.CampaignLeadResponse;
import com.nexorcrm.backend.dto.LeadCreateRequest;
import com.nexorcrm.backend.dto.LeadResponse;
import com.nexorcrm.backend.entity.CampaignLead;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.CampaignLeadRepository;
import com.nexorcrm.backend.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class CampaignLeadService {

    private final CampaignLeadRepository campaignLeadRepository;
    private final LeadService leadService;
    private final UserRepository userRepository;

    public CampaignLeadService(CampaignLeadRepository campaignLeadRepository,
                               LeadService leadService,
                               UserRepository userRepository) {
        this.campaignLeadRepository = campaignLeadRepository;
        this.leadService = leadService;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CampaignLeadResponse> listPendingCampaignLeads() {
        return campaignLeadRepository.findByLeadStatus("PENDING")
                .stream()
                .map(CampaignLeadResponse::new)
                .toList();
    }

    public void saveIncomingLead(Map<String, String> data) {
        // Accept both camelCase (test form) and snake_case (Meta webhook)
        String leadId = coalesce(data, "lead_id", "leadId");

        // Auto-generate a test ID if none provided
        if (leadId == null || leadId.trim().isEmpty()) {
            leadId = "TEST_" + System.currentTimeMillis();
        }

        // Avoid duplicate inserts
        if (campaignLeadRepository.findByLeadId(leadId).isPresent()) {
            return;
        }

        CampaignLead entity = new CampaignLead();
        entity.setLeadId(leadId);
        entity.setCreatedTime(coalesce(data, "created_time", "createdTime"));
        entity.setAdId(coalesce(data, "ad_id", "adId"));
        entity.setAdName(coalesce(data, "ad_name", "adName"));
        entity.setAdsetId(coalesce(data, "adset_id", "adsetId"));
        entity.setAdsetName(coalesce(data, "adset_name", "adsetName"));
        entity.setCampaignId(coalesce(data, "campaign_id", "campaignId"));
        entity.setCampaignName(coalesce(data, "campaign_name", "campaignName"));
        entity.setFormId(coalesce(data, "form_id", "formId"));
        entity.setFormName(coalesce(data, "form_name", "formName"));
        entity.setIsOrganic(coalesce(data, "is_organic", "isOrganic"));
        entity.setPlatform(data.get("platform"));
        entity.setMoq(data.get("moq"));
        entity.setIndustry(data.get("industry"));
        entity.setEmail(data.get("email"));
        entity.setFullName(coalesce(data, "full_name", "fullName"));
        entity.setCity(data.get("city"));

        // Clean up "p:" prefix in phone numbers from Instagram/Facebook
        String rawPhone = data.get("phone");
        if (rawPhone != null) {
            rawPhone = rawPhone.trim();
            if (rawPhone.startsWith("p:")) {
                rawPhone = rawPhone.substring(2).trim();
            }
        }
        entity.setPhone(rawPhone);
        entity.setLeadStatus("PENDING");

        campaignLeadRepository.save(entity);
    }

    /** Returns first non-null value from the map for the given keys. */
    private String coalesce(Map<String, String> map, String... keys) {
        for (String key : keys) {
            String val = map.get(key);
            if (val != null && !val.isEmpty()) return val;
        }
        return null;
    }

    public LeadResponse assignCampaignLead(Long id, Long employeeId, Long leadGroupId, String actorPrincipal) {
        CampaignLead campaignLead = campaignLeadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Campaign lead not found"));

        if (!"PENDING".equalsIgnoreCase(campaignLead.getLeadStatus())) {
            throw new IllegalStateException("Campaign lead is already assigned");
        }

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        // Build LeadCreateRequest to create a real CRM Lead
        LeadCreateRequest createRequest = new LeadCreateRequest();
        
        // Use full_name if present, fallback to "Ad Lead"
        String leadName = campaignLead.getFullName();
        if (leadName == null || leadName.trim().isEmpty()) {
            leadName = "Ad Lead " + campaignLead.getLeadId().substring(0, Math.min(campaignLead.getLeadId().length(), 6));
        }
        createRequest.setName(leadName);
        createRequest.setEmail(campaignLead.getEmail());
        createRequest.setMobile(campaignLead.getPhone() != null ? campaignLead.getPhone() : "");
        createRequest.setPrimarySource("Social Media");

        // Map Meta platform to secondary source
        String secondary = "Meta Ads";
        if (campaignLead.getPlatform() != null) {
            String pf = campaignLead.getPlatform().trim().toLowerCase();
            if ("ig".equals(pf) || "instagram".equals(pf)) {
                secondary = "Instagram";
            } else if ("fb".equals(pf) || "facebook".equals(pf)) {
                secondary = "Facebook";
            }
        }
        createRequest.setSecondarySource(secondary);

        // Map Ad Name to tertiary source
        createRequest.setTertiarySource(campaignLead.getAdName() != null ? campaignLead.getAdName() : "Meta Ads");
        
        // Add custom fields
        createRequest.setCompanyName(campaignLead.getIndustry() != null ? "Industry: " + campaignLead.getIndustry() : "");
        createRequest.setProductType("Corrugated Box");
        createRequest.setVariant(campaignLead.getMoq() != null ? "MOQ Required: " + campaignLead.getMoq() : "");
        createRequest.setLeadCity(campaignLead.getCity());
        createRequest.setAssignedUserId(employee.getId());
        // Pass the lead group so LeadService can validate eligibility correctly
        createRequest.setLeadGroupId(leadGroupId);

        // Call standard LeadService to persist & trigger default workflow assignment logic
        LeadResponse leadResponse = leadService.create(createRequest, actorPrincipal);

        // Mark campaign lead as assigned
        campaignLead.setLeadStatus("ASSIGNED");
        campaignLeadRepository.save(campaignLead);

        return leadResponse;
     }

    public void deleteCampaignLead(Long id) {
        CampaignLead campaignLead = campaignLeadRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Campaign lead not found"));
        campaignLeadRepository.delete(campaignLead);
    }
}
