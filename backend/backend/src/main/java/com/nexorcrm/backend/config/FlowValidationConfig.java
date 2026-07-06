package com.nexorcrm.backend.config;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Flow Validation Configuration
 * Defines validation requirements for status transitions.
 * These rules are returned by the Flow API and enforced on the frontend.
 *
 * Rules can include:
 * - requirePayment100Percent: Enforces that payment must be 100% complete
 * - requireDesignUpload: Enforces that design must be uploaded
 * - requireFields: List of required fields that must be filled
 * - validationMessage: Custom error message to show to user
 */
public class FlowValidationConfig {

    /**
     * Get default Lead Flow Rules with validation requirements
     */
    public static List<Map<String, Object>> getDefaultLeadFlowRules() {
        List<Map<String, Object>> rules = new ArrayList<>();

        // New Lead → Not Attempted
        rules.add(createRule("new lead", 
            Map.of("not attempted", "Not Attempted"),
            null, false, false, null, null));

        // Not Attempted → Attempted/Interested/Rejected
        rules.add(createRule("not attempted",
            Map.of("attempted", "Attempted", "interested", "Interested", "rejected", "Rejected"),
            null, false, false, null, null));

        // Attempted → Interested/Rejected
        rules.add(createRule("attempted",
            Map.of("interested", "Interested", "rejected", "Rejected"),
            null, false, false, null, null));

        // Interested → Requirements Collected/Rejected
        rules.add(createRule("interested",
            Map.of("requirement", "Requirements Collected", "rejected", "Rejected"),
            null, false, false, null, null));

        // Requirement → Budget
        rules.add(createRule("requirement",
            Map.of("budget", "Budget", "rejected", "Rejected"),
            null, false, false, null, null));

        // Budget → Design
        rules.add(createRule("budget",
            Map.of("design", "Design", "rejected", "Rejected"),
            null, false, false, null, null));

        // Design → Payment
        rules.add(createRule("design",
            Map.of("payment", "Payment", "rejected", "Rejected"),
            null, false, true, null, "Please upload the final design before moving to Payment"));

        // Payment → Deal/Rejected
        rules.add(createRule("payment",
            Map.of("deal", "Deal", "rejected", "Rejected"),
            null, false, false, null, null));

        // Deal (Read-only)
        rules.add(createRule("deal",
            Map.of(),
            null, false, false, null, null));

        // Production (Read-only)
        rules.add(createRule("production",
            Map.of(),
            null, false, false, null, null));

        return rules;
    }

    /**
     * Get default Deal Flow Rules with validation requirements
     * Deals require more strict validation (100% payment before delivery)
     */
    public static List<Map<String, Object>> getDefaultDealFlowRules() {
        List<Map<String, Object>> rules = new ArrayList<>();

        // New Lead → Attempted
        rules.add(createRule("new lead",
            Map.of("attempted", "Attempted"),
            null, false, false, null, null));

        // Attempted → Interested/Rejected
        rules.add(createRule("attempted",
            Map.of("interested", "Interested", "rejected", "Rejected"),
            null, false, false, null, null));

        // Interested → Requirements Collected/Rejected
        rules.add(createRule("interested",
            Map.of("requirement", "Requirements Collected", "rejected", "Rejected"),
            null, false, false, null, null));

        // Requirement → Budget/Rejected
        rules.add(createRule("requirement",
            Map.of("budget", "Budget", "rejected", "Rejected"),
            null, false, false, null, null));

        // Budget → Design / Design + Production
        rules.add(createRule("budget",
            Map.of("design", "Design", "design + production", "Design + Production", "rejected", "Rejected"),
            null, false, false, null, null));

        // Design → Payment
        rules.add(createRule("design",
            Map.of("payment", "Payment", "design + production", "Design + Production", "rejected", "Rejected"),
            null, false, true, null, "Please upload the final design before moving to Payment"));

        // Design + Production → Payment
        rules.add(createRule("design + production",
            Map.of("payment", "Payment", "production", "Production", "rejected", "Rejected"),
            null, false, true, null, "Please upload the final design before moving to Payment"));

        // Payment → Deal / Production / Delivery
        rules.add(createRule("payment",
            Map.of("deal", "Deal", "production", "Production", "delivery", "Delivery", "rejected", "Rejected"),
            null, true, false, null, "Payment must be 100% complete before moving to Delivery"));

        // Delivery → Production / Accounts / Completed
        rules.add(createRule("delivery",
            Map.of("production", "Production", "accounts", "Accounts", "completed", "Completed"),
            null, true, false, null, "Payment must be 100% complete before Delivery"));

        // Production → Stock Request / Delivery / Accounts / Approval / Purchase / Production Resume / Completed
        rules.add(createRule("production",
            Map.of(
                "stock request", "Stock Request",
                "delivery", "Delivery",
                "accounts", "Accounts",
                "approval", "Approval",
                "purchase", "Purchase",
                "production resume", "Production Resume",
                "completed", "Completed"
            ),
            null, false, false, null, null));

        // Stock Request → Stock Updated / Production / Delivery / Accounts
        rules.add(createRule("stock request",
            Map.of(
                "stock updated", "Stock Updated",
                "production", "Production",
                "delivery", "Delivery",
                "accounts", "Accounts"
            ),
            null, false, false, null, null));

        // Stock Updated → Production / Delivery / Accounts / Completed
        rules.add(createRule("stock updated",
            Map.of("production", "Production", "delivery", "Delivery", "accounts", "Accounts", "completed", "Completed"),
            null, false, false, null, null));

        // Accounts → Accounts Review / Approval / Completed
        rules.add(createRule("accounts",
            Map.of("accounts review", "Accounts Review", "approval", "Approval", "completed", "Completed"),
            null, false, false, null, null));

        // Accounts Review → Approval / Purchase / Completed
        rules.add(createRule("accounts review",
            Map.of("approval", "Approval", "purchase", "Purchase", "completed", "Completed"),
            null, false, false, null, null));

        // Approval → Purchase / Completed
        rules.add(createRule("approval",
            Map.of("purchase", "Purchase", "completed", "Completed"),
            null, false, false, null, null));

        // Purchase → Completed
        rules.add(createRule("purchase",
            Map.of("completed", "Completed"),
            null, false, false, null, null));

        // Production Resume → Production / Delivery / Accounts / Completed
        rules.add(createRule("production resume",
            Map.of("production", "Production", "delivery", "Delivery", "accounts", "Accounts", "completed", "Completed"),
            null, false, false, null, null));

        // Deal (Read-only)
        rules.add(createRule("deal",
            Map.of(),
            null, false, false, null, null));

        // Completed (Final status, read-only)
        rules.add(createRule("completed",
            Map.of(),
            null, false, false, null, null));

        return rules;
    }

    /**
     * Helper method to create a flow rule with validation properties
     *
     * @param status Current status
     * @param next Map of next statuses
     * @param handledByGroupId Group ID that handles this status
     * @param requirePayment100Percent If true, payment must be 100% complete
     * @param requireDesignUpload If true, design must be uploaded
     * @param requireFields List of required field names
     * @param validationMessage Custom validation error message
     * @return Rule as Map
     */
    private static Map<String, Object> createRule(
        String status,
        Map<String, String> next,
        Long handledByGroupId,
        Boolean requirePayment100Percent,
        Boolean requireDesignUpload,
        List<String> requireFields,
        String validationMessage) {

        Map<String, Object> rule = new HashMap<>();
        rule.put("status", status);
        rule.put("next", next);

        if (handledByGroupId != null) {
            rule.put("handledByGroupId", handledByGroupId);
        }

        // Add validation properties if they are relevant
        if (Boolean.TRUE.equals(requirePayment100Percent)) {
            rule.put("requirePayment100Percent", true);
        }

        if (Boolean.TRUE.equals(requireDesignUpload)) {
            rule.put("requireDesignUpload", true);
        }

        if (requireFields != null && !requireFields.isEmpty()) {
            rule.put("requireFields", requireFields);
        }

        if (validationMessage != null) {
            rule.put("validationMessage", validationMessage);
        }

        return rule;
    }

    /**
     * Get Lead statuses that should be available
     */
    public static List<String> getDefaultLeadStatuses() {
        return Arrays.asList(
            "New Lead",
            "Not Attempted",
            "Attempted",
            "Interested",
            "Requirement",
            "Budget",
            "Design",
            "Payment",
            "Deal",
            "Production"
        );
    }

    /**
     * Get Deal statuses that should be available
     */
    public static List<String> getDefaultDealStatuses() {
        return Arrays.asList(
            "New Lead",
            "Attempted",
            "Interested",
            "Requirement",
            "Budget",
            "Design",
            "Design + Production",
            "Payment",
            "Deal",
            "Production",
            "Stock Request",
            "Stock Updated",
            "Delivery",
            "Accounts",
            "Accounts Review",
            "Approval",
            "Purchase",
            "Production Resume",
            "Completed"
        );
    }
}
