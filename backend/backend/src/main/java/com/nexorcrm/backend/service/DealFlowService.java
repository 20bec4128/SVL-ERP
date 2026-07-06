package com.nexorcrm.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexorcrm.backend.dto.LeadFlowRequest;
import com.nexorcrm.backend.dto.LeadFlowResponse;
import com.nexorcrm.backend.entity.LeadFlowConfig;
import com.nexorcrm.backend.repo.LeadFlowConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class DealFlowService {

    // Use id=2 to keep deal flow separate from lead flow (id=1)
    private static final Long DEAL_FLOW_ID = 2L;

    private final LeadFlowConfigRepository leadFlowConfigRepository;
    private final ObjectMapper objectMapper;

    public DealFlowService(LeadFlowConfigRepository leadFlowConfigRepository,
                           ObjectMapper objectMapper) {
        this.leadFlowConfigRepository = leadFlowConfigRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public LeadFlowResponse getFlow() {
        LeadFlowConfig config = leadFlowConfigRepository.findById(DEAL_FLOW_ID).orElseGet(() -> {
            LeadFlowConfig created = new LeadFlowConfig();
            created.setId(DEAL_FLOW_ID);
            return created;
        });
        return toResponse(config);
    }

    @Transactional
    public LeadFlowResponse updateFlow(LeadFlowRequest request, String actorPrincipal) {
        LeadFlowConfig config = leadFlowConfigRepository.findById(DEAL_FLOW_ID).orElseGet(() -> {
            LeadFlowConfig created = new LeadFlowConfig();
            created.setId(DEAL_FLOW_ID);
            return created;
        });
        config.setDefaultGroupId(request.getDefaultGroupId());
        config.setRulesJson(serializeRules(request.getRules()));
        config.setStatusesJson(serializeStatuses(request.getStatuses()));
        if (StringUtils.hasText(actorPrincipal)) {
            config.setUpdatedBy(actorPrincipal);
        }
        LeadFlowConfig saved = leadFlowConfigRepository.save(config);
        return toResponse(saved);
    }

    private String serializeRules(List<Map<String, Object>> rules) {
        try {
            if (rules == null) return null;
            return objectMapper.writeValueAsString(rules);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to save deal flow rules");
        }
    }

    private List<Map<String, Object>> parseRules(String json) {
        try {
            if (!StringUtils.hasText(json)) return Collections.emptyList();
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String serializeStatuses(List<String> statuses) {
        try {
            if (statuses == null) return null;
            return objectMapper.writeValueAsString(statuses);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to save deal flow statuses");
        }
    }

    private List<String> parseStatuses(String json) {
        try {
            if (!org.springframework.util.StringUtils.hasText(json)) return null;
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private LeadFlowResponse toResponse(LeadFlowConfig config) {
        LeadFlowResponse response = new LeadFlowResponse();
        response.setDefaultGroupId(config.getDefaultGroupId());
        response.setRules(parseRules(config.getRulesJson()));
        response.setStatuses(parseStatuses(config.getStatusesJson()));
        response.setUpdatedBy(config.getUpdatedBy());
        response.setUpdatedAt(config.getUpdatedAt());
        return response;
    }
}
