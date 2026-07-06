package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.PrimarySourceRequest;
import com.nexorcrm.backend.dto.PrimarySourceResponse;
import com.nexorcrm.backend.entity.PrimarySource;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.PrimarySourceRepository;
import com.nexorcrm.backend.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class PrimarySourceService {

    private final PrimarySourceRepository primarySourceRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public PrimarySourceService(PrimarySourceRepository primarySourceRepository,
                                UserRepository userRepository,
                                AuditService auditService) {
        this.primarySourceRepository = primarySourceRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<PrimarySourceResponse> list(String actorPrincipal) {
        resolveActor(actorPrincipal);
        return primarySourceRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PrimarySourceResponse create(PrimarySourceRequest request, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);

        String name = request.getPrimarySource().trim();
        if (primarySourceRepository.existsBySourceNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalStateException("Primary source already exists");
        }

        PrimarySource row = new PrimarySource();
        row.setPrimaryId(generatePrimaryId());
        row.setSourceName(name);

        PrimarySource saved = primarySourceRepository.save(row);
        auditService.log("PRIMARY_SOURCE_CREATE", "Created primary source", actor.getEmail());
        return toResponse(saved);
    }

    public PrimarySourceResponse update(Long id, PrimarySourceRequest request, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);
        PrimarySource row = primarySourceRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Primary source not found"));

        String name = request.getPrimarySource().trim();
        if (primarySourceRepository.existsBySourceNameIgnoreCaseAndDeletedFalseAndIdNot(name, id)) {
            throw new IllegalStateException("Primary source already exists");
        }

        row.setSourceName(name);
        PrimarySource saved = primarySourceRepository.save(row);
        auditService.log("PRIMARY_SOURCE_UPDATE", "Updated primary source", actor.getEmail());
        return toResponse(saved);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);
        PrimarySource row = primarySourceRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Primary source not found"));

        row.setDeleted(true);
        primarySourceRepository.save(row);
        auditService.log("PRIMARY_SOURCE_DELETE", "Deleted primary source", actor.getEmail());
    }

    private User assertAllowed(String actorPrincipal) {
        return resolveActor(actorPrincipal);
    }

    private User resolveActor(String actorPrincipal) {
        if (!StringUtils.hasText(actorPrincipal)) {
            throw new AccessDeniedException("Unauthenticated actor");
        }

        if (actorPrincipal.contains("@")) {
            return userRepository.findByEmailAndIsDeletedFalse(actorPrincipal.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
        }

        return userRepository.findByUsernameAndIsDeletedFalse(actorPrincipal.trim())
                .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
    }

    private String generatePrimaryId() {
        return "PRISO_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
    }

    private PrimarySourceResponse toResponse(PrimarySource row) {
        PrimarySourceResponse res = new PrimarySourceResponse();
        res.setId(row.getId());
        res.setPrimaryId(row.getPrimaryId());
        res.setPrimarySource(row.getSourceName());
        res.setCreatedDate(row.getCreatedAt());
        return res;
    }
}
