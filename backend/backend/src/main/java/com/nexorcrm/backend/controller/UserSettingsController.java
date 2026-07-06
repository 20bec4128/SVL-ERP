package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.UserSettingsResponse;
import com.nexorcrm.backend.dto.UserSettingsUpdateRequest;
import com.nexorcrm.backend.service.UserSettingsService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings/user")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
public class UserSettingsController {

    private final UserSettingsService service;

    public UserSettingsController(UserSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public UserSettingsResponse getSettings() {
        return service.getSettings();
    }

    @PutMapping
    public UserSettingsResponse updateSettings(@Valid @RequestBody UserSettingsUpdateRequest request,
                                               Authentication authentication) {
        String updatedBy = authentication != null ? authentication.getName() : "SYSTEM";
        return service.updateSettings(request, updatedBy);
    }
}
