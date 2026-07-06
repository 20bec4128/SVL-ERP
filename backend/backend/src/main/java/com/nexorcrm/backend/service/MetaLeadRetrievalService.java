package com.nexorcrm.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class MetaLeadRetrievalService {

    private static final Logger logger = LoggerFactory.getLogger(MetaLeadRetrievalService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${meta.page-access-token:PLACEHOLDER}")
    private String pageAccessToken;

    public Map<String, String> fetchLeadDetails(String leadGenId) {
        Map<String, String> leadData = new HashMap<>();
        leadData.put("lead_id", leadGenId);

        if ("PLACEHOLDER".equals(pageAccessToken) || pageAccessToken.trim().isEmpty()) {
            logger.warn("Meta Page Access Token is not configured. Returning empty lead details.");
            return leadData;
        }

        try {
            String url = "https://graph.facebook.com/v20.0/" + leadGenId + "?access_token=" + pageAccessToken;
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());

                if (root.has("created_time")) {
                    leadData.put("created_time", root.get("created_time").asText());
                }
                if (root.has("id")) {
                    leadData.put("lead_id", root.get("id").asText());
                }
                if (root.has("ad_id")) {
                    leadData.put("ad_id", root.get("ad_id").asText());
                }
                if (root.has("ad_name")) {
                    leadData.put("ad_name", root.get("ad_name").asText());
                }
                if (root.has("adset_id")) {
                    leadData.put("adset_id", root.get("adset_id").asText());
                }
                if (root.has("adset_name")) {
                    leadData.put("adset_name", root.get("adset_name").asText());
                }
                if (root.has("campaign_id")) {
                    leadData.put("campaign_id", root.get("campaign_id").asText());
                }
                if (root.has("campaign_name")) {
                    leadData.put("campaign_name", root.get("campaign_name").asText());
                }
                if (root.has("form_id")) {
                    leadData.put("form_id", root.get("form_id").asText());
                }
                if (root.has("form_name")) {
                    leadData.put("form_name", root.get("form_name").asText());
                }
                if (root.has("is_organic")) {
                    leadData.put("is_organic", root.get("is_organic").asText());
                }
                if (root.has("platform")) {
                    leadData.put("platform", root.get("platform").asText());
                }

                if (root.has("field_data")) {
                    JsonNode fieldDataNode = root.get("field_data");
                    for (JsonNode field : fieldDataNode) {
                        String name = field.get("name").asText();
                        JsonNode values = field.get("values");
                        if (values != null && values.isArray() && values.size() > 0) {
                            String val = values.get(0).asText();
                            if (name.contains("moq") || name.contains("quantity")) {
                                leadData.put("moq", val);
                            } else if (name.contains("industry")) {
                                leadData.put("industry", val);
                            } else if (name.equals("email")) {
                                leadData.put("email", val);
                            } else if (name.equals("full_name") || name.equals("name")) {
                                leadData.put("full_name", val);
                            } else if (name.equals("phone_number") || name.equals("phone")) {
                                leadData.put("phone", val);
                            } else if (name.equals("city")) {
                                leadData.put("city", val);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error fetching lead details from Meta Graph API for lead_id: " + leadGenId, e);
        }

        return leadData;
    }
}
