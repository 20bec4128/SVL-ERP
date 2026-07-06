package com.nexorcrm.backend.service;

import com.nexorcrm.backend.config.FlowValidationConfig;
import com.nexorcrm.backend.entity.LeadFlowConfig;
import com.nexorcrm.backend.repo.LeadFlowConfigRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;

/**
 * Service to initialize default Flow Rules with Validation Requirements
 * Runs on application startup to ensure flow rules include validation properties.
 */
@Service
public class FlowRulesInitializationService {

    private static final Logger logger = LoggerFactory.getLogger(FlowRulesInitializationService.class);
    private static final Long LEAD_FLOW_ID = 1L;
    private static final Long DEAL_FLOW_ID = 2L;

    private final LeadFlowConfigRepository leadFlowConfigRepository;
    private final ObjectMapper objectMapper;

    public FlowRulesInitializationService(
        LeadFlowConfigRepository leadFlowConfigRepository,
        ObjectMapper objectMapper) {
        this.leadFlowConfigRepository = leadFlowConfigRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Initialize Lead Flow Rules with default validation requirements
     * Call this during application startup or when rules are missing
     */
    @Transactional
    public void initializeLeadFlowRules() {
        try {
            LeadFlowConfig config = leadFlowConfigRepository.findById(LEAD_FLOW_ID)
                .orElseGet(() -> {
                    LeadFlowConfig newConfig = new LeadFlowConfig();
                    newConfig.setId(LEAD_FLOW_ID);
                    return newConfig;
                });

            // Only initialize if rules are empty/null
            if (!StringUtils.hasText(config.getRulesJson())) {
                logger.info("Initializing Lead Flow Rules with validation requirements...");
                String rulesJson = objectMapper.writeValueAsString(
                    FlowValidationConfig.getDefaultLeadFlowRules()
                );
                config.setRulesJson(rulesJson);

                String statusesJson = objectMapper.writeValueAsString(
                    FlowValidationConfig.getDefaultLeadStatuses()
                );
                config.setStatusesJson(statusesJson);

                config.setUpdatedBy("SYSTEM");
                config.setUpdatedAt(LocalDateTime.now());
                leadFlowConfigRepository.save(config);
                logger.info("✓ Lead Flow Rules initialized successfully");
            } else {
                logger.info("Lead Flow Rules already configured, skipping initialization");
            }
        } catch (Exception e) {
            logger.error("Failed to initialize Lead Flow Rules", e);
            throw new RuntimeException("Failed to initialize Lead Flow Rules", e);
        }
    }

    /**
     * Initialize Deal Flow Rules with default validation requirements
     * Call this during application startup or when rules are missing
     */
    @Transactional
    public void initializeDealFlowRules() {
        try {
            LeadFlowConfig config = leadFlowConfigRepository.findById(DEAL_FLOW_ID)
                .orElseGet(() -> {
                    LeadFlowConfig newConfig = new LeadFlowConfig();
                    newConfig.setId(DEAL_FLOW_ID);
                    return newConfig;
                });

            // Only initialize if rules are empty/null
            if (!StringUtils.hasText(config.getRulesJson())) {
                logger.info("Initializing Deal Flow Rules with validation requirements...");
                String rulesJson = objectMapper.writeValueAsString(
                    FlowValidationConfig.getDefaultDealFlowRules()
                );
                config.setRulesJson(rulesJson);

                String statusesJson = objectMapper.writeValueAsString(
                    FlowValidationConfig.getDefaultDealStatuses()
                );
                config.setStatusesJson(statusesJson);

                config.setUpdatedBy("SYSTEM");
                config.setUpdatedAt(LocalDateTime.now());
                leadFlowConfigRepository.save(config);
                logger.info("✓ Deal Flow Rules initialized successfully");
            } else {
                logger.info("Deal Flow Rules already configured, skipping initialization");
            }
        } catch (Exception e) {
            logger.error("Failed to initialize Deal Flow Rules", e);
            throw new RuntimeException("Failed to initialize Deal Flow Rules", e);
        }
    }

    /**
     * Initialize both Lead and Deal Flow Rules
     */
    @Transactional
    public void initializeAllFlowRules() {
        initializeLeadFlowRules();
        initializeDealFlowRules();
    }
}
