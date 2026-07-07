package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.service.CampaignLeadService;
import com.nexorcrm.backend.service.MetaLeadRetrievalService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class MetaWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(MetaWebhookController.class);
    private final CampaignLeadService campaignLeadService;
    private final MetaLeadRetrievalService metaLeadRetrievalService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${meta.verify.token:${meta.verify-token:svl_crm_secret}}")
    private String verifyToken;

    public MetaWebhookController(CampaignLeadService campaignLeadService,
                                 MetaLeadRetrievalService metaLeadRetrievalService) {
        this.campaignLeadService = campaignLeadService;
        this.metaLeadRetrievalService = metaLeadRetrievalService;
    }

    /**
     * Webhook verification endpoint (GET request called by Meta during configuration).
     */
    @GetMapping({"/meta/webhook", "/api/v1/webhook/meta"})
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(value = "hub.mode", required = false) String mode,
            @RequestParam(value = "hub.verify_token", required = false) String token,
            @RequestParam(value = "hub.challenge", required = false) String challenge) {

        logger.info("Meta Webhook Verification triggered. Mode: {}, Token: {}", mode, token);

        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            logger.info("Meta Webhook successfully verified.");
            return ResponseEntity.ok(challenge);
        } else {
            logger.warn("Meta Webhook verification failed. Invalid Verify Token.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
        }
    }

    /**
     * Webhook event receiver (POST request called by Meta when a lead is created).
     */
    @PostMapping({"/meta/webhook", "/api/v1/webhook/meta"})
    public ResponseEntity<String> receiveWebhookEvent(@RequestBody String requestBody) {
        logger.info("Meta Webhook Event Received: {}", requestBody);

        try {
            JsonNode root = objectMapper.readTree(requestBody);

            if (root.has("entry")) {
                JsonNode entryArray = root.get("entry");
                for (JsonNode entry : entryArray) {
                    if (entry.has("changes")) {
                        JsonNode changesArray = entry.get("changes");
                        for (JsonNode change : changesArray) {
                            JsonNode valueNode = change.get("value");
                            if (valueNode != null && valueNode.has("leadgen_id")) {
                                String leadGenId = valueNode.get("leadgen_id").asText();
                                logger.info("Retrieved Lead ID from webhook: {}. Fetching details...", leadGenId);

                                // Fetch details from Meta and store in backend
                                Map<String, String> metaLeadDetails = metaLeadRetrievalService.fetchLeadDetails(leadGenId);
                                campaignLeadService.saveIncomingLead(metaLeadDetails);
                            }
                        }
                    }
                }
            }
            return ResponseEntity.ok("SUCCESS");
        } catch (Exception e) {
            logger.error("Error processing Meta webhook payload", e);
            // Return 200 to prevent Meta from retrying continuously on error
            return ResponseEntity.ok("ERROR_BUT_ACKNOWLEDGED");
        }
    }
}
