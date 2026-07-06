package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.MailSettingsResponse;
import com.nexorcrm.backend.dto.MailSettingsUpsertRequest;
import com.nexorcrm.backend.entity.MailSettings;
import com.nexorcrm.backend.repo.MailSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class MailSettingsService {

    private final MailSettingsRepository repository;
    private final MailCryptoService cryptoService;

    public MailSettingsService(MailSettingsRepository repository, MailCryptoService cryptoService) {
        this.repository = repository;
        this.cryptoService = cryptoService;
    }

    @Transactional(readOnly = true)
    public Optional<MailSettings> getCurrent() {
        return repository.findAll().stream().findFirst();
    }

    @Transactional(readOnly = true)
    public Optional<MailSettingsResponse> getCurrentResponse() {
        return getCurrent().map(this::toResponse);
    }

    @Transactional
    public MailSettingsResponse upsert(MailSettingsUpsertRequest request, String updatedBy) {
        MailSettings row = getCurrent().orElseGet(MailSettings::new);

        if (request != null) {
            if (request.getEnabled() != null) row.setEnabled(request.getEnabled());
            if (request.getHost() != null) row.setHost(trimToNull(request.getHost()));
            if (request.getPort() != null) row.setPort(request.getPort());
            if (request.getUsername() != null) row.setUsername(trimToNull(request.getUsername()));
            if (request.getSmtpAuth() != null) row.setSmtpAuth(request.getSmtpAuth());
            if (request.getStarttls() != null) row.setStarttls(request.getStarttls());
            if (request.getFromAddress() != null) row.setFromAddress(trimToNull(request.getFromAddress()));
            if (request.getFromName() != null) row.setFromName(trimToNull(request.getFromName()));
            if (request.getCc() != null) row.setCc(trimToNull(request.getCc()));
            if (request.getBcc() != null) row.setBcc(trimToNull(request.getBcc()));

            // Only update password when the caller provided a non-blank string.
            if (StringUtils.hasText(request.getPassword())) {
                row.setPasswordEnc(cryptoService.encrypt(request.getPassword().trim()));
            }
        }

        row.setUpdatedAt(LocalDateTime.now());
        row.setUpdatedBy(trimToNull(updatedBy));
        row = repository.save(row);
        return toResponse(row);
    }

    public ResolvedMailSettings resolve() {
        Optional<MailSettings> db = getCurrent();
        if (db.isEmpty()) return null;
        MailSettings row = db.get();

        ResolvedMailSettings res = new ResolvedMailSettings();
        res.enabled = Boolean.TRUE.equals(row.getEnabled());
        res.host = trimToNull(row.getHost());
        res.port = row.getPort() == null ? 587 : row.getPort();
        res.username = trimToNull(row.getUsername());
        res.password = cryptoService.decrypt(row.getPasswordEnc());
        res.smtpAuth = Boolean.TRUE.equals(row.getSmtpAuth());
        res.starttls = Boolean.TRUE.equals(row.getStarttls());
        res.fromAddress = trimToNull(row.getFromAddress());
        res.fromName = trimToNull(row.getFromName());
        res.cc = trimToNull(row.getCc());
        res.bcc = trimToNull(row.getBcc());
        return res;
    }

    private MailSettingsResponse toResponse(MailSettings row) {
        MailSettingsResponse res = new MailSettingsResponse();
        res.setId(row.getId());
        res.setEnabled(Boolean.TRUE.equals(row.getEnabled()));
        res.setHost(row.getHost());
        res.setPort(row.getPort() == null ? 587 : row.getPort());
        res.setUsername(row.getUsername());
        res.setHasPassword(StringUtils.hasText(row.getPasswordEnc()));
        res.setSmtpAuth(Boolean.TRUE.equals(row.getSmtpAuth()));
        res.setStarttls(Boolean.TRUE.equals(row.getStarttls()));
        res.setFromAddress(row.getFromAddress());
        res.setFromName(row.getFromName());
        res.setCc(row.getCc());
        res.setBcc(row.getBcc());
        res.setUpdatedAt(row.getUpdatedAt());
        res.setUpdatedBy(row.getUpdatedBy());
        return res;
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    public static class ResolvedMailSettings {
        public boolean enabled;
        public String host;
        public int port;
        public String username;
        public String password;
        public boolean smtpAuth;
        public boolean starttls;
        public String fromAddress;
        public String fromName;
        public String cc;
        public String bcc;
    }
}
