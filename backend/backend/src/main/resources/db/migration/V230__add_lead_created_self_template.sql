INSERT INTO email_templates (template_key, template_name, subject, body, is_builtin, is_active, created_at, updated_at)
VALUES (
    'LEAD_CREATED_SELF_TEMPLATE',
    'New Lead Created by Employee (To Reporting Person)',
    'New Lead Created by {{Employee Name}}',
    'Dear {{Reporting Person Name}},

A new lead has been created by {{Employee Name}} and has been automatically assigned to them for follow-up.

Lead Details
Lead ID: {{Lead ID}}
Customer Name: {{Customer Name}}
Company: {{Company Name}}
Contact Number: {{Phone Number}}
Email: {{Customer Email}}
Requirement: {{Requirement}}
Priority: {{Priority}}
Employee Details
Created By: {{Employee Name}}
Assigned To: {{Employee Name}}
Created On: {{Created Date}}

This notification is for your information and tracking purposes.

Regards,
{{Company Name}}
CRM System',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (template_key) DO UPDATE
SET template_name = EXCLUDED.template_name,
    subject = EXCLUDED.subject,
    body = EXCLUDED.body;
