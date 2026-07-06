UPDATE email_templates 
SET template_name = 'New Lead Assigned (To Employee)',
    subject = 'New Lead Assigned – {{Lead Name}}',
    body = 'Dear {{Employee Name}},

A new lead has been assigned to you for follow-up.

Lead Details
Lead ID: {{Lead ID}}
Customer Name: {{Customer Name}}
Company: {{Company Name}}
Contact Number: {{Phone}}
Email: {{Customer Email}}
Requirement: {{Requirement}}
Assigned By: {{Assigned By}}
Assigned Date: {{Assigned Date}}

Please review the lead and update the status regularly in the system.

Regards,
{{Company Name}}'
WHERE template_key = 'LEAD_ASSIGNED_EMPLOYEE_TEMPLATE';
