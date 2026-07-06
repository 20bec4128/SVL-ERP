package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.SessionSettingsResponse;
import com.nexorcrm.backend.dto.SessionSettingsUpdateRequest;
import com.nexorcrm.backend.service.SessionSettingsService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings/session")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class SessionSettingsController {

    private final SessionSettingsService service;

    public SessionSettingsController(SessionSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public SessionSettingsResponse getSettings() {
        return service.getSettings();
    }

    @PutMapping
    public SessionSettingsResponse updateSettings(@Valid @RequestBody SessionSettingsUpdateRequest request,
                                                  Authentication authentication) {
        String updatedBy = authentication != null ? authentication.getName() : "SYSTEM";
        return service.updateSettings(request, updatedBy);
    }
}
