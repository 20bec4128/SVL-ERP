package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.ResetRequest;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.service.AuditService;
import com.nexorcrm.backend.service.RefreshTokenService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recovery")
public class RecoveryController {

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final AuditService auditService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${recovery.enabled:${RECOVERY_ENABLED:false}}")
    private boolean recoveryEnabled;

    @Value("${recovery.secret.token:${RECOVERY_SECRET_TOKEN:}}")
    private String recoverySecretToken;

    public RecoveryController(UserRepository userRepository,
                              RefreshTokenService refreshTokenService,
                              AuditService auditService) {
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.auditService = auditService;
    }

    @PostMapping("/reset-superadmin")
    public ResponseEntity<ApiMessageResponse> resetSuperAdmin(
            @RequestHeader(value = "X-Recovery-Token", required = false) String headerToken,
            @Valid @RequestBody ResetRequest request) {

        if (!recoveryEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiMessageResponse("Recovery is disabled"));
        }

        if (!StringUtils.hasText(recoverySecretToken) || !recoverySecretToken.equals(headerToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiMessageResponse("Invalid recovery token"));
        }

        User superAdmin = userRepository.findByRole(Role.SUPER_ADMIN)
                .orElseThrow(() -> new EntityNotFoundException("SUPER_ADMIN user not found"));

        superAdmin.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        superAdmin.setForcePasswordChange(false);
        userRepository.save(superAdmin);

        refreshTokenService.revokeAllUserTokens(superAdmin);
        auditService.logAsSystem("RECOVERY_USED", "Super admin password reset via recovery endpoint", superAdmin.getEmail());

        return ResponseEntity.ok(new ApiMessageResponse("Super admin password reset successful"));
    }
}
