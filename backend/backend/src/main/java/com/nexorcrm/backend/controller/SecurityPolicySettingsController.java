package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.SecurityPolicySettingsResponse;
import com.nexorcrm.backend.dto.SecurityPolicySettingsUpdateRequest;
import com.nexorcrm.backend.service.SecurityPolicySettingsService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings/security-policy")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class SecurityPolicySettingsController {

    private final SecurityPolicySettingsService service;

    public SecurityPolicySettingsController(SecurityPolicySettingsService service) {
        this.service = service;
    }

    @GetMapping
    public SecurityPolicySettingsResponse getSettings() {
        return service.getSettings();
    }

    @PutMapping
    public SecurityPolicySettingsResponse updateSettings(@Valid @RequestBody SecurityPolicySettingsUpdateRequest request,
                                                         Authentication authentication) {
        String updatedBy = authentication != null ? authentication.getName() : "SYSTEM";
        return service.updateSettings(request, updatedBy);
    }
}
