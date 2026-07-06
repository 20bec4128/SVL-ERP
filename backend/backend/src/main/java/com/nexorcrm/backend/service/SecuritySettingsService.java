package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.AddBannedIpRequest;
import com.nexorcrm.backend.dto.AddDisallowedUsernameRequest;
import com.nexorcrm.backend.dto.RemoveBannedIpsRequest;
import com.nexorcrm.backend.dto.RemoveDisallowedUsernamesRequest;
import com.nexorcrm.backend.dto.SecuritySettingsResponse;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.SecurityBannedIp;
import com.nexorcrm.backend.entity.SecurityDisallowedUsername;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.RefreshTokenRepository;
import com.nexorcrm.backend.repo.SecurityBannedIpRepository;
import com.nexorcrm.backend.repo.SecurityDisallowedUsernameRepository;
import com.nexorcrm.backend.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@Transactional
public class SecuritySettingsService {

    private final SecurityDisallowedUsernameRepository disallowedUsernameRepository;
    private final SecurityBannedIpRepository bannedIpRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditService auditService;

    public SecuritySettingsService(SecurityDisallowedUsernameRepository disallowedUsernameRepository,
                                   SecurityBannedIpRepository bannedIpRepository,
                                   UserRepository userRepository,
                                   RefreshTokenRepository refreshTokenRepository,
                                   AuditService auditService) {
        this.disallowedUsernameRepository = disallowedUsernameRepository;
        this.bannedIpRepository = bannedIpRepository;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public SecuritySettingsResponse getSettings(String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanManage(actor);
        SecuritySettingsResponse response = new SecuritySettingsResponse();
        response.setDisallowedUsernames(disallowedUsernameRepository.findAllByOrderByUsernameAsc()
                .stream()
                .map(SecurityDisallowedUsername::getUsername)
                .toList());
        response.setBannedIps(bannedIpRepository.findAllByOrderByIpAddressAsc()
                .stream()
                .map(SecurityBannedIp::getIpAddress)
                .toList());
        return response;
    }

    public SecuritySettingsResponse addDisallowedUsername(AddDisallowedUsernameRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanManage(actor);
        String username = normalize(request.getUsername());
        if (!disallowedUsernameRepository.existsByUsername(username)) {
            SecurityDisallowedUsername row = new SecurityDisallowedUsername();
            row.setUsername(username);
            disallowedUsernameRepository.save(row);
            auditService.log("SECURITY_DISALLOWED_USERNAME_ADD", "Added disallowed username", actor.getEmail());

            userRepository.findByUsernameAndIsDeletedFalse(username).ifPresent(user -> {
                refreshTokenRepository.deleteByUser(user);
            });
        }
        return getSettings(actorPrincipal);
    }

    public SecuritySettingsResponse removeDisallowedUsernames(RemoveDisallowedUsernamesRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanManage(actor);
        List<String> usernames = normalizeMany(request == null ? null : request.getUsernames());
        if (!usernames.isEmpty()) {
            disallowedUsernameRepository.deleteByUsernameIn(usernames);
            auditService.log("SECURITY_DISALLOWED_USERNAME_REMOVE", "Removed disallowed usernames", actor.getEmail());
        }
        return getSettings(actorPrincipal);
    }

    public SecuritySettingsResponse addBannedIp(AddBannedIpRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanManage(actor);
        String ipAddress = normalize(request.getIpAddress());
        if (!bannedIpRepository.existsByIpAddress(ipAddress)) {
            SecurityBannedIp row = new SecurityBannedIp();
            row.setIpAddress(ipAddress);
            bannedIpRepository.save(row);
            auditService.log("SECURITY_BANNED_IP_ADD", "Added banned IP", actor.getEmail());
        }
        return getSettings(actorPrincipal);
    }

    public SecuritySettingsResponse removeBannedIps(RemoveBannedIpsRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanManage(actor);
        List<String> ips = normalizeMany(request == null ? null : request.getIpAddresses());
        if (!ips.isEmpty()) {
            bannedIpRepository.deleteByIpAddressIn(ips);
            auditService.log("SECURITY_BANNED_IP_REMOVE", "Removed banned IPs", actor.getEmail());
        }
        return getSettings(actorPrincipal);
    }

    @Transactional(readOnly = true)
    public boolean isUsernameDisallowed(String username) {
        if (!StringUtils.hasText(username)) return false;
        return disallowedUsernameRepository.existsByUsername(normalize(username));
    }

    @Transactional(readOnly = true)
    public boolean isIpBanned(String ipAddress) {
        if (!StringUtils.hasText(ipAddress)) return false;
        return bannedIpRepository.existsByIpAddress(normalize(ipAddress));
    }

    private User resolveActor(String actorPrincipal) {
        if (!StringUtils.hasText(actorPrincipal)) {
            throw new AccessDeniedException("Unauthenticated actor");
        }
        if (actorPrincipal.contains("@")) {
            return userRepository.findByEmailAndIsDeletedFalse(actorPrincipal.trim().toLowerCase())
                    .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
        }
        return userRepository.findByUsernameAndIsDeletedFalse(actorPrincipal.trim())
                .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
    }

    private void assertCanManage(User actor) {
        if (actor.getRole() != Role.SUPER_ADMIN && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You do not have permission to manage security settings");
        }
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase() : "";
    }

    private List<String> normalizeMany(List<String> values) {
        if (values == null || values.isEmpty()) return List.of();
        return values.stream()
                .filter(StringUtils::hasText)
                .map(this::normalize)
                .toList();
    }
}
