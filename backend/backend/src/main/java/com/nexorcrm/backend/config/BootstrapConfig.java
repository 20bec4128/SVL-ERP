package com.nexorcrm.backend.config;

import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.ActivationStatus;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class BootstrapConfig implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger log = LoggerFactory.getLogger(BootstrapConfig.class);

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${bootstrap.enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${bootstrap.superadmin.username:}")
    private String bootstrapUsername;

    @Value("${bootstrap.superadmin.email:}")
    private String bootstrapEmail;

    @Value("${bootstrap.superadmin.password:}")
    private String bootstrapPassword;

    public BootstrapConfig(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        if (!bootstrapEnabled) {
            log.info("Bootstrap disabled");
            return;
        }

        if (userRepository.existsByRoleAndIsDeletedFalse(Role.SUPER_ADMIN)) {
            log.info("Super Admin exists, skipping");
            return;
        }

        validateRequired(bootstrapUsername, "bootstrap.superadmin.username");
        validateRequired(bootstrapEmail, "bootstrap.superadmin.email");
        validateRequired(bootstrapPassword, "bootstrap.superadmin.password");

        User user = new User();
        user.setUsername(bootstrapUsername.trim());
        user.setEmail(bootstrapEmail.trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(bootstrapPassword));
        user.setRole(Role.SUPER_ADMIN);
        user.setActivationStatus(ActivationStatus.ACTIVE);
        user.setActive(true);
        user.setForcePasswordChange(false);
        user.setCreatedBy("SYSTEM");

        userRepository.save(user);
        log.info("Super Admin bootstrapped successfully");
    }

    private void validateRequired(String value, String propertyName) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("Missing required bootstrap property: " + propertyName);
        }
    }
}
