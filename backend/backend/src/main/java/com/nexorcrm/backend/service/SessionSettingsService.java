package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.SessionSettingsResponse;
import com.nexorcrm.backend.dto.SessionSettingsUpdateRequest;
import com.nexorcrm.backend.entity.SessionSettings;
import com.nexorcrm.backend.repo.SessionSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class SessionSettingsService {

    private final SessionSettingsRepository repository;
    private final AuditService auditService;

    public SessionSettingsService(SessionSettingsRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public SessionSettingsResponse getSettings() {
        SessionSettings settings = getOrCreateDefault();
        return toResponse(settings);
    }

    public SessionSettingsResponse updateSettings(SessionSettingsUpdateRequest request, String updatedBy) {
        SessionSettings settings = getOrCreateDefault();
        settings.setSessionTimeoutMinutes(request.getSessionTimeoutMinutes());
        settings.setRememberMeDays(request.getRememberMeDays());
        settings.setMaxConcurrentSessions(request.getMaxConcurrentSessions());
        settings.setPreventConcurrentLogins(request.getPreventConcurrentLogins());
        settings.setWarningBeforeLogoutSeconds(request.getWarningBeforeLogoutSeconds());
        settings.setUpdatedAt(LocalDateTime.now());
        settings.setUpdatedBy(updatedBy);

        SessionSettings saved = repository.save(settings);
        auditService.log("SESSION_SETTINGS_UPDATE", "Updated session settings", updatedBy);

        return toResponse(saved);
    }

    private SessionSettings getOrCreateDefault() {
        return repository.findAll().stream().findFirst().orElseGet(() -> {
            SessionSettings defaultSettings = new SessionSettings();
            return repository.save(defaultSettings);
        });
    }

    private SessionSettingsResponse toResponse(SessionSettings settings) {
        SessionSettingsResponse response = new SessionSettingsResponse();
        response.setId(settings.getId());
        response.setSessionTimeoutMinutes(settings.getSessionTimeoutMinutes());
        response.setRememberMeDays(settings.getRememberMeDays());
        response.setMaxConcurrentSessions(settings.getMaxConcurrentSessions());
        response.setPreventConcurrentLogins(settings.getPreventConcurrentLogins());
        response.setWarningBeforeLogoutSeconds(settings.getWarningBeforeLogoutSeconds());
        response.setUpdatedAt(settings.getUpdatedAt());
        response.setUpdatedBy(settings.getUpdatedBy());
        return response;
    }
}
