package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.MailSettingsResponse;
import com.nexorcrm.backend.dto.MailSettingsTestRequest;
import com.nexorcrm.backend.dto.MailSettingsUpsertRequest;
import com.nexorcrm.backend.service.EmailNotificationService;
import com.nexorcrm.backend.service.MailSettingsService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/settings/mail")
public class MailSettingsController {

    private final MailSettingsService mailSettingsService;
    private final EmailNotificationService emailNotificationService;

    public MailSettingsController(MailSettingsService mailSettingsService, EmailNotificationService emailNotificationService) {
        this.mailSettingsService = mailSettingsService;
        this.emailNotificationService = emailNotificationService;
    }

    @GetMapping
    public MailSettingsResponse get() {
        return mailSettingsService.getCurrentResponse().orElse(null);
    }

    @PutMapping
    public MailSettingsResponse upsert(@RequestBody MailSettingsUpsertRequest request,
                                      org.springframework.security.core.Authentication authentication) {
        String updatedBy = authentication == null ? null : authentication.getName();
        return mailSettingsService.upsert(request, updatedBy);
    }

    @PostMapping("/test")
    public java.util.Map<String, Object> test(@RequestBody MailSettingsTestRequest request) {
        String to = request == null ? null : request.getToAddress();
        if (to == null || to.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "toAddress is required");
        }
        if (!emailNotificationService.isMailEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mail is disabled");
        }
        emailNotificationService.sendTestEmail(to.trim());
        return java.util.Map.of("message", "Test email sent");
    }
}

