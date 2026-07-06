package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.CampaignLeadResponse;
import com.nexorcrm.backend.dto.CampaignLeadAssignRequest;
import com.nexorcrm.backend.dto.LeadResponse;
import com.nexorcrm.backend.service.CampaignLeadService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/campaign-leads")
public class CampaignLeadController {

    private final CampaignLeadService campaignLeadService;

    public CampaignLeadController(CampaignLeadService campaignLeadService) {
        this.campaignLeadService = campaignLeadService;
    }

    @GetMapping
    public ResponseEntity<List<CampaignLeadResponse>> listPendingCampaignLeads() {
        return ResponseEntity.ok(campaignLeadService.listPendingCampaignLeads());
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<LeadResponse> assignCampaignLead(
            @PathVariable("id") Long id,
            @RequestBody CampaignLeadAssignRequest request,
            Authentication authentication) {
        String actorPrincipal = authentication.getName();
        LeadResponse res = campaignLeadService.assignCampaignLead(
                id, request.getEmployeeId(), request.getLeadGroupId(), actorPrincipal);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/incoming-lead")
    public ResponseEntity<String> saveDirectIncomingLead(@RequestBody java.util.Map<String, String> requestBody) {
        campaignLeadService.saveIncomingLead(requestBody);
        return ResponseEntity.ok("SUCCESS");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaignLead(@PathVariable("id") Long id) {
        campaignLeadService.deleteCampaignLead(id);
        return ResponseEntity.ok().build();
    }
}
