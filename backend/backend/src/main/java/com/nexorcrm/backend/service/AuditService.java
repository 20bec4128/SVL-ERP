package com.nexorcrm.backend.service;

import com.nexorcrm.backend.entity.AuditLog;
import com.nexorcrm.backend.repo.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final HttpServletRequest request;
    private final AuditLogRepository auditLogRepository;

    public AuditService(HttpServletRequest request, AuditLogRepository auditLogRepository) {
        this.request = request;
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String action, String description, String targetUser) {
        String performedBy = resolvePerformedBy();
        saveAudit(action, performedBy, description, targetUser);
    }

    public void logAsActor(String action, String performedBy, String description, String targetUser) {
        String actor = StringUtils.hasText(performedBy) ? performedBy.trim() : "SYSTEM";
        saveAudit(action, actor, description, targetUser);
    }

    public void logAsSystem(String action, String description, String targetUser) {
        saveAudit(action, "SYSTEM", description, targetUser);
    }

    private void saveAudit(String action, String performedBy, String description, String targetUser) {
        String ip = resolveIpAddress();
        log.info("AUDIT action={} performedBy={} targetUser={} ip={} description={}",
                action, performedBy, targetUser, ip, description);

        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setPerformedBy(performedBy);
        auditLog.setTargetUser(targetUser);
        auditLog.setDescription(description);
        auditLog.setIpAddress(ip);
        auditLogRepository.save(auditLog);
    }

    private String resolvePerformedBy() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            return "SYSTEM";
        }
        String actor = authentication.getName().trim();
        if ("anonymousUser".equalsIgnoreCase(actor)) {
            return "SYSTEM";
        }
        return actor;
    }

    private String resolveIpAddress() {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            int comma = forwarded.indexOf(',');
            return comma > -1 ? forwarded.substring(0, comma).trim() : forwarded.trim();
        }
        return request.getRemoteAddr();
    }
}
