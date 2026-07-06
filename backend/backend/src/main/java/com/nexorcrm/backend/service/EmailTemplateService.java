package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.EmailTemplateResponse;
import com.nexorcrm.backend.dto.EmailTemplateUpsertRequest;
import com.nexorcrm.backend.entity.EmailTemplate;
import com.nexorcrm.backend.entity.EmailTemplateKey;
import com.nexorcrm.backend.repo.EmailTemplateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@Service
public class EmailTemplateService {

    private final EmailTemplateRepository repository;

    public EmailTemplateService(EmailTemplateRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Map<String, Object> getAll() {
        ensureSeedTemplates();
        List<EmailTemplateResponse> templates = repository.findAllByOrderByTemplateKeyAsc()
                .stream()
                .map(this::toResponse)
                .toList();
        Map<String, Object> response = new HashMap<>();
        response.put("templates", templates);
        return response;
    }

    @Transactional
    public EmailTemplateResponse getOne(String templateKey) {
        return toResponse(requireTemplate(templateKey));
    }

    @Transactional
    public EmailTemplateResponse save(String templateKey, EmailTemplateUpsertRequest request) {
        EmailTemplate template = requireTemplate(templateKey);
        applyRequest(template, request);
        return toResponse(repository.save(template));
    }

    @Transactional
    public EmailTemplateResponse create(EmailTemplateUpsertRequest request) {
        EmailTemplate template = new EmailTemplate();
        template.setTemplateKey(resolveTemplateKey(request));
        template.setTemplateName(trimToNull(request == null ? null : request.getTemplateName()));
        template.setBuiltIn(false);
        applyRequest(template, request);
        if (template.getTemplateName() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Template name is required");
        }
        return toResponse(repository.save(template));
    }

    @Transactional
    public void delete(String templateKey) {
        EmailTemplate template = requireTemplate(templateKey);
        if (template.isBuiltIn()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Default templates cannot be deleted");
        }
        repository.delete(template);
    }

    private void applyRequest(EmailTemplate template, EmailTemplateUpsertRequest request) {
        if (template == null) return;
        if (request != null && request.getTemplateName() != null) {
            String name = trimToNull(request.getTemplateName());
            if (name != null) {
                template.setTemplateName(name);
            }
        }
        if (request != null && request.getTemplateKey() != null && !template.isBuiltIn()) {
            String key = trimToNull(request.getTemplateKey());
            if (key != null) {
                template.setTemplateKey(key);
            }
        }
        template.setSubject(trimToNull(request == null ? null : request.getSubject()));
        template.setBody(trimToNull(request == null ? null : request.getBody()));
        if (request != null && request.getActive() != null) {
            template.setActive(request.getActive());
        }
    }

    private EmailTemplate getOrCreateTemplate(String templateKey) {
        EmailTemplateKey key = EmailTemplateKey.fromKey(templateKey);
        if (key == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found");
        }
        return repository.findByTemplateKey(key.getKey())
                .orElseGet(() -> {
                    EmailTemplate template = new EmailTemplate();
                    template.setTemplateKey(key.getKey());
                    template.setTemplateName(key.getLabel());
                    template.setSubject(defaultSubject(key));
                    template.setBody(defaultBody(key));
                    template.setBuiltIn(true);
                    return repository.save(template);
                });
    }

    private EmailTemplate requireTemplate(String templateKey) {
        EmailTemplate existing = repository.findByTemplateKey(trimToNull(templateKey))
                .orElse(null);
        if (existing != null) {
            return existing;
        }
        EmailTemplateKey builtInKey = EmailTemplateKey.fromKey(templateKey);
        if (builtInKey != null) {
            return getOrCreateTemplate(builtInKey.getKey());
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found");
    }

    private void ensureSeedTemplates() {
        for (EmailTemplateKey key : EmailTemplateKey.values()) {
            getOrCreateTemplate(key.getKey());
        }
    }

    private String resolveTemplateKey(EmailTemplateUpsertRequest request) {
        String providedKey = trimToNull(request == null ? null : request.getTemplateKey());
        if (providedKey != null) {
            String normalized = providedKey.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]+", "_");
            return ensureUniqueTemplateKey(normalized);
        }

        String name = trimToNull(request == null ? null : request.getTemplateName());
        if (name == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Template name is required");
        }

        String base = name.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_").replaceAll("_+", "_");
        base = base.replaceAll("^_", "").replaceAll("_$", "");
        if (base.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Template name is required");
        }
        if (!base.endsWith("_TEMPLATE")) {
            base = base + "_TEMPLATE";
        }
        return ensureUniqueTemplateKey(base);
    }

    private String ensureUniqueTemplateKey(String baseKey) {
        String key = baseKey;
        int suffix = 2;
        while (repository.existsByTemplateKey(key)) {
            key = baseKey + "_" + suffix++;
        }
        return key;
    }

    private EmailTemplateResponse toResponse(EmailTemplate template) {
        EmailTemplateResponse response = new EmailTemplateResponse();
        response.setTemplateKey(template.getTemplateKey());
        response.setTemplateName(template.getTemplateName());
        response.setSubject(template.getSubject());
        response.setBody(template.getBody());
        response.setBuiltIn(template.isBuiltIn());
        response.setActive(template.isActive());
        response.setCreatedAt(template.getCreatedAt());
        response.setUpdatedAt(template.getUpdatedAt());
        return response;
    }

    private String defaultSubject(EmailTemplateKey key) {
        return switch (key) {
            case OFFER_LETTER_TEMPLATE -> "Offer Letter - {{employee_name}}";
            case PROFILE_COMPLETION_TEMPLATE -> "Complete Your Profile - {{employee_name}}";
            case LEAD_ASSIGNED_EMPLOYEE_TEMPLATE -> "New Lead Assigned – {{Lead Name}}";
            case LEAD_ASSIGNED_CUSTOMER_TEMPLATE -> "SVL ERP - Lead Representative Assigned";
            case LEAD_STATUS_UPDATED_TEMPLATE -> "Lead Status Updated: {{lead_id}} - {{lead_name}}";
            case LEAD_CREATED_SELF_TEMPLATE -> "New Lead Created by {{Employee Name}}";
            case PAYSLIP_EMAIL_TEMPLATE -> "Payslip for {{month}}";
            case QUOTATION_SENT_TEMPLATE -> "Quotation {{quotation_number}} - SVL Packaging & Printing";
        };
    }

    private String defaultBody(EmailTemplateKey key) {
        return switch (key) {
            case OFFER_LETTER_TEMPLATE -> "Dear {{employee_name}},\n\nWe are pleased to offer you the position of **{{designation}}** at **{{company_name}}**.\n\n### 1. Employment Details\n\n* **Employee ID**: [Auto-generated]\n* **Department**: [Department Name]\n* **Designation**: [Designation]\n* **Work Location**: [Branch Name]\n\n### 2. Compensation\n\nYour compensation details are as follows:\n\n* **CTC**: ₹[Amount] per annum\n* Detailed salary structure will be shared separately.\n\n### 3. Profile Completion (Mandatory Step)\n\nAs part of onboarding, you are required to complete your profile by providing additional details such as:\n\n* Address & Personal Information\n* Bank Details\n* Identity Proof Documents\n* Educational & Experience Details\n\nPlease use the secure link below to complete your profile:\n\n👉 **Complete Your Profile**: [Profile Completion Link]\n\n**Note:**\n\n* This link is secure and valid until [Expiry Date].\n* You can access it without login.\n* Please ensure all details and documents are accurate.\n\n### 4. Verification & Approval\n\n* Your submitted details will be reviewed by our HR team.\n* In case of any discrepancies, you will receive a new link to update specific fields.\n* Final confirmation of employment is subject to successful verification.\n\n### 5. Terms & Conditions\n\n* You are required to join on or before the mentioned joining date.\n* All submitted documents must be genuine.\n* The company reserves the right to withdraw this offer if any information is found incorrect.\n\n### 6. Acceptance\n\nPlease confirm your acceptance of this offer by replying to this email.\n\nWe look forward to welcoming you to our organization.\n\nBest Regards,\n**[HR Name]**\n[Company Name]\n[Contact Details]";
            case PROFILE_COMPLETION_TEMPLATE -> "Hello {{employee_name}},\n\nPlease complete your profile using the secure link shared with you. Submit all required details and documents so we can continue the verification process.\n\nRegards,\nHR Team";
            case LEAD_ASSIGNED_EMPLOYEE_TEMPLATE -> "Dear {{Employee Name}},\n\nA new lead has been assigned to you for follow-up.\n\nLead Details\nLead ID: {{Lead ID}}\nCustomer Name: {{Customer Name}}\nCompany: {{Company Name}}\nContact Number: {{Phone}}\nEmail: {{Customer Email}}\nRequirement: {{Requirement}}\nAssigned By: {{Assigned By}}\nAssigned Date: {{Assigned Date}}\n\nPlease review the lead and update the status regularly in the system.\n\nRegards,\n{{Company Name}}";
            case LEAD_ASSIGNED_CUSTOMER_TEMPLATE -> "Dear {{lead_name}},\n\nAn executive from SVL, {{employee_name}}, has been assigned to assist you with your request. They will contact you shortly.\n\nBest regards,\nSVL Team";
            case LEAD_STATUS_UPDATED_TEMPLATE -> "Hello {{official_name}},\n\nThe status of the lead {{lead_id}} ({{lead_name}}) has been updated to \"{{status}}\".\n\nBest regards,\nSVL ERP";
            case LEAD_CREATED_SELF_TEMPLATE -> "Dear {{Reporting Person Name}},\n\nA new lead has been created by {{Employee Name}} and has been automatically assigned to them for follow-up.\n\nLead Details\nLead ID: {{Lead ID}}\nCustomer Name: {{Customer Name}}\nCompany: {{Company Name}}\nContact Number: {{Phone Number}}\nEmail: {{Customer Email}}\nRequirement: {{Requirement}}\nPriority: {{Priority}}\nEmployee Details\nCreated By: {{Employee Name}}\nAssigned To: {{Employee Name}}\nCreated On: {{Created Date}}\n\nThis notification is for your information and tracking purposes.\n\nRegards,\n{{Company Name}}\nCRM System";
            case PAYSLIP_EMAIL_TEMPLATE -> "Dear {{employee_name}},\n\nWe hope you are doing well.\n\nYour payslip for the month of {{month}} has been generated and is attached to this email for your reference.\n\nPlease review the attached document for complete details regarding your earnings, deductions, and net salary.\n\nPayslip Details\n\nEmployee Name: {{employee_name}}\nEmployee ID: {{employee_code}}\nPay Period: {{month}}\n\nIf you have any questions regarding your salary or payroll calculations, please contact the HR Department.\n\nThank you.\n\nBest Regards,\nHR Department\nSVL Packaging Printing";
            case QUOTATION_SENT_TEMPLATE -> "Dear {{customer_name}},\n\nWe are pleased to send you our quotation.\n\nPlease find the complete details in the attached quotation document.\n\nFor any queries, negotiations, or to accept/reject this quotation, please contact our representative:\nName: {{representative_name}}\nEmail: {{representative_email}}\nMobile: {{representative_mobile}}\n\nThank you for choosing SVL.\n\nBest Regards,\nSVL Packaging & Printing Team";
        };
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
