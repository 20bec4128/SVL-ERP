package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.RegistrationSettingsResponse;
import com.nexorcrm.backend.dto.RegistrationSettingsUpdateRequest;
import com.nexorcrm.backend.service.RegistrationSettingsService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings/registration")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class RegistrationSettingsController {

    private final RegistrationSettingsService service;

    public RegistrationSettingsController(RegistrationSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public RegistrationSettingsResponse getSettings() {
        return service.getSettings();
    }

    @PutMapping
    public RegistrationSettingsResponse updateSettings(@Valid @RequestBody RegistrationSettingsUpdateRequest request,
                                                       Authentication authentication) {
        String updatedBy = authentication != null ? authentication.getName() : "SYSTEM";
        return service.updateSettings(request, updatedBy);
    }
}
