-- Email template settings for employee communications
CREATE TABLE IF NOT EXISTS email_templates (
    id BIGSERIAL PRIMARY KEY,
    template_key VARCHAR(80) NOT NULL UNIQUE,
    template_name VARCHAR(200) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION set_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_templates_updated_at ON email_templates;
CREATE TRIGGER trg_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION set_email_templates_updated_at();

INSERT INTO email_templates (template_key, template_name, subject, body)
VALUES
    (
        'OFFER_LETTER_TEMPLATE',
        'Offer Letter Template',
        'Offer Letter - {{employee_name}}',
        E'Dear {{employee_name}},\n\nWe are pleased to offer you the position of **{{designation}}** at **{{company_name}}**.\n\n### 1. Employment Details\n\n* **Employee ID**: [Auto-generated]\n* **Department**: [Department Name]\n* **Designation**: [Designation]\n* **Work Location**: [Branch Name]\n\n### 2. Compensation\n\nYour compensation details are as follows:\n\n* **CTC**: ₹[Amount] per annum\n* Detailed salary structure will be shared separately.\n\n### 3. Profile Completion (Mandatory Step)\n\nAs part of onboarding, you are required to complete your profile by providing additional details such as:\n\n* Address & Personal Information\n* Bank Details\n* Identity Proof Documents\n* Educational & Experience Details\n\nPlease use the secure link below to complete your profile:\n\n👉 **Complete Your Profile**: [Profile Completion Link]\n\n**Note:**\n\n* This link is secure and valid until [Expiry Date].\n* You can access it without login.\n* Please ensure all details and documents are accurate.\n\n### 4. Verification & Approval\n\n* Your submitted details will be reviewed by our HR team.\n* In case of any discrepancies, you will receive a new link to update specific fields.\n* Final confirmation of employment is subject to successful verification.\n\n### 5. Terms & Conditions\n\n* You are required to join on or before the mentioned joining date.\n* All submitted documents must be genuine.\n* The company reserves the right to withdraw this offer if any information is found incorrect.\n\n### 6. Acceptance\n\nPlease confirm your acceptance of this offer by replying to this email.\n\nWe look forward to welcoming you to our organization.\n\nBest Regards,\n**[HR Name]**\n[Company Name]\n[Contact Details]'
    ),
    (
        'PROFILE_COMPLETION_TEMPLATE',
        'Profile Completion Template',
        'Complete Your Profile - {{employee_name}}',
        E'Hello {{employee_name}},\n\nPlease complete your profile using the secure link shared with you. Submit all required details and documents so we can continue the verification process.\n\nRegards,\nHR Team'
    )
ON CONFLICT (template_key) DO NOTHING;
