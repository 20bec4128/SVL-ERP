package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.UserSettingsResponse;
import com.nexorcrm.backend.dto.UserSettingsUpdateRequest;
import com.nexorcrm.backend.entity.UserSettings;
import com.nexorcrm.backend.repo.UserSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class UserSettingsService {

    private final UserSettingsRepository repository;
    private final AuditService auditService;

    public UserSettingsService(UserSettingsRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public UserSettingsResponse getSettings() {
        UserSettings settings = getOrCreateDefault();
        return toResponse(settings);
    }

    public UserSettingsResponse updateSettings(UserSettingsUpdateRequest request, String updatedBy) {
        UserSettings settings = getOrCreateDefault();
        settings.setAllowProfileEditing(request.getAllowProfileEditing());
        settings.setAllowPasswordChange(request.getAllowPasswordChange());
        settings.setEnableTwoFactorAuth(request.getEnableTwoFactorAuth());
        settings.setDefaultLanguage(request.getDefaultLanguage());
        settings.setDefaultTimezone(request.getDefaultTimezone());
        settings.setUpdatedAt(LocalDateTime.now());
        settings.setUpdatedBy(updatedBy);

        UserSettings saved = repository.save(settings);
        auditService.log("USER_SETTINGS_UPDATE", "Updated user settings", updatedBy);

        return toResponse(saved);
    }

    private UserSettings getOrCreateDefault() {
        return repository.findAll().stream().findFirst().orElseGet(() -> {
            UserSettings defaultSettings = new UserSettings();
            return repository.save(defaultSettings);
        });
    }

    private UserSettingsResponse toResponse(UserSettings settings) {
        UserSettingsResponse response = new UserSettingsResponse();
        response.setId(settings.getId());
        response.setAllowProfileEditing(settings.getAllowProfileEditing());
        response.setAllowPasswordChange(settings.getAllowPasswordChange());
        response.setEnableTwoFactorAuth(settings.getEnableTwoFactorAuth());
        response.setDefaultLanguage(settings.getDefaultLanguage());
        response.setDefaultTimezone(settings.getDefaultTimezone());
        response.setUpdatedAt(settings.getUpdatedAt());
        response.setUpdatedBy(settings.getUpdatedBy());
        return response;
    }
}
