package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.RegistrationSettingsResponse;
import com.nexorcrm.backend.dto.RegistrationSettingsUpdateRequest;
import com.nexorcrm.backend.entity.RegistrationSettings;
import com.nexorcrm.backend.repo.RegistrationSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class RegistrationSettingsService {

    private final RegistrationSettingsRepository repository;
    private final AuditService auditService;

    public RegistrationSettingsService(RegistrationSettingsRepository repository, AuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public RegistrationSettingsResponse getSettings() {
        RegistrationSettings settings = getOrCreateDefault();
        return toResponse(settings);
    }

    public RegistrationSettingsResponse updateSettings(RegistrationSettingsUpdateRequest request, String updatedBy) {
        RegistrationSettings settings = getOrCreateDefault();
        settings.setAllowSelfRegistration(request.getAllowSelfRegistration());
        settings.setRequireEmailVerification(request.getRequireEmailVerification());
        settings.setRequireAdminApproval(request.getRequireAdminApproval());
        settings.setAllowedDomains(request.getAllowedDomains());
        settings.setDefaultRole(request.getDefaultRole());
        settings.setUpdatedAt(LocalDateTime.now());
        settings.setUpdatedBy(updatedBy);

        RegistrationSettings saved = repository.save(settings);
        auditService.log("REGISTRATION_SETTINGS_UPDATE", "Updated registration settings", updatedBy);

        return toResponse(saved);
    }

    private RegistrationSettings getOrCreateDefault() {
        return repository.findAll().stream().findFirst().orElseGet(() -> {
            RegistrationSettings defaultSettings = new RegistrationSettings();
            return repository.save(defaultSettings);
        });
    }

    private RegistrationSettingsResponse toResponse(RegistrationSettings settings) {
        RegistrationSettingsResponse response = new RegistrationSettingsResponse();
        response.setId(settings.getId());
        response.setAllowSelfRegistration(settings.getAllowSelfRegistration());
        response.setRequireEmailVerification(settings.getRequireEmailVerification());
        response.setRequireAdminApproval(settings.getRequireAdminApproval());
        response.setAllowedDomains(settings.getAllowedDomains());
        response.setDefaultRole(settings.getDefaultRole());
        response.setUpdatedAt(settings.getUpdatedAt());
        response.setUpdatedBy(settings.getUpdatedBy());
        return response;
    }
}
