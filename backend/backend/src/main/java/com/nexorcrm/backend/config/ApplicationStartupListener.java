package com.nexorcrm.backend.config;

import com.nexorcrm.backend.service.FlowRulesInitializationService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Application Startup Listener
 * Initializes Flow Rules with validation requirements when the application starts.
 * This ensures that all status transitions have proper validation rules defined.
 */
@Component
public class ApplicationStartupListener {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationStartupListener.class);
    private final FlowRulesInitializationService flowRulesInitializationService;

    public ApplicationStartupListener(FlowRulesInitializationService flowRulesInitializationService) {
        this.flowRulesInitializationService = flowRulesInitializationService;
    }

    /**
     * Triggered when the application has started and is ready.
     * Initializes Flow Rules if they don't exist yet.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        logger.info("========================================");
        logger.info("Initializing Flow Rules with Validations");
        logger.info("========================================");
        
        try {
            flowRulesInitializationService.initializeAllFlowRules();
            logger.info("========================================");
            logger.info("✓ Flow Rules Initialization Complete");
            logger.info("========================================");
        } catch (Exception e) {
            logger.error("Failed to initialize Flow Rules on startup", e);
            // Don't throw exception - allow app to start even if initialization fails
            // Rules can be configured manually via API later
        }
    }
}
