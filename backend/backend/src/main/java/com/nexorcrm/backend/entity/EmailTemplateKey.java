package com.nexorcrm.backend.entity;

import java.util.Locale;

public enum EmailTemplateKey {
    OFFER_LETTER_TEMPLATE("Offer Letter Template"),
    PROFILE_COMPLETION_TEMPLATE("Profile Completion Template"),
    LEAD_ASSIGNED_EMPLOYEE_TEMPLATE("New Lead Assigned (To Employee)"),
    LEAD_ASSIGNED_CUSTOMER_TEMPLATE("Lead Assigned to Customer Template"),
    LEAD_STATUS_UPDATED_TEMPLATE("Lead Status Updated Template"),
    LEAD_CREATED_SELF_TEMPLATE("New Lead Created by Employee (To Reporting Person)"),
    PAYSLIP_EMAIL_TEMPLATE("Payslip Email Template"),
    QUOTATION_SENT_TEMPLATE("Quotation Sent Template");

    private final String label;

    EmailTemplateKey(String label) {
        this.label = label;
    }

    public String getKey() {
        return name();
    }

    public String getLabel() {
        return label;
    }

    public static EmailTemplateKey fromKey(String key) {
        if (key == null) return null;
        try {
            return EmailTemplateKey.valueOf(key.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            return null;
        }
    }
}
