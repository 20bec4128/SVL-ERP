package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.SecondarySourceRequest;
import com.nexorcrm.backend.dto.SecondarySourceResponse;
import com.nexorcrm.backend.entity.PrimarySource;
import com.nexorcrm.backend.entity.SecondarySource;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.PrimarySourceRepository;
import com.nexorcrm.backend.repo.SecondarySourceRepository;
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
public class SecondarySourceService {

    private final SecondarySourceRepository secondarySourceRepository;
    private final PrimarySourceRepository primarySourceRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public SecondarySourceService(SecondarySourceRepository secondarySourceRepository,
                                  PrimarySourceRepository primarySourceRepository,
                                  UserRepository userRepository,
                                  AuditService auditService) {
        this.secondarySourceRepository = secondarySourceRepository;
        this.primarySourceRepository = primarySourceRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<SecondarySourceResponse> list(String actorPrincipal) {
        resolveActor(actorPrincipal);
        return secondarySourceRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public SecondarySourceResponse create(SecondarySourceRequest request, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);

        String name = request.getSecondarySource().trim();
        PrimarySource primarySource = resolvePrimarySource(request.getPrimarySourceId());
        if (secondarySourceRepository.existsBySourceNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalStateException("Secondary source already exists");
        }

        SecondarySource row = new SecondarySource();
        row.setSecondaryId(generateSecondaryId());
        row.setSourceName(name);
        row.setPrimarySourceId(primarySource.getId());

        SecondarySource saved = secondarySourceRepository.save(row);
        auditService.log("SECONDARY_SOURCE_CREATE", "Created secondary source", actor.getEmail());
        return toResponse(saved, primarySource);
    }

    public SecondarySourceResponse update(Long id, SecondarySourceRequest request, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);
        SecondarySource row = secondarySourceRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Secondary source not found"));

        String name = request.getSecondarySource().trim();
        PrimarySource primarySource = resolvePrimarySource(request.getPrimarySourceId());
        if (secondarySourceRepository.existsBySourceNameIgnoreCaseAndDeletedFalseAndIdNot(name, id)) {
            throw new IllegalStateException("Secondary source already exists");
        }

        row.setSourceName(name);
        row.setPrimarySourceId(primarySource.getId());
        SecondarySource saved = secondarySourceRepository.save(row);
        auditService.log("SECONDARY_SOURCE_UPDATE", "Updated secondary source", actor.getEmail());
        return toResponse(saved, primarySource);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);
        SecondarySource row = secondarySourceRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Secondary source not found"));

        row.setDeleted(true);
        secondarySourceRepository.save(row);
        auditService.log("SECONDARY_SOURCE_DELETE", "Deleted secondary source", actor.getEmail());
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

    private String generateSecondaryId() {
        return "SECSO_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
    }

    private PrimarySource resolvePrimarySource(Long primarySourceId) {
        if (primarySourceId == null) {
            throw new IllegalArgumentException("Primary source is required");
        }
        return primarySourceRepository.findByIdAndDeletedFalse(primarySourceId)
                .orElseThrow(() -> new EntityNotFoundException("Primary source not found"));
    }

    private SecondarySourceResponse toResponse(SecondarySource row) {
        PrimarySource primarySource = row.getPrimarySourceId() == null
                ? null
                : primarySourceRepository.findByIdAndDeletedFalse(row.getPrimarySourceId()).orElse(null);
        return toResponse(row, primarySource);
    }

    private SecondarySourceResponse toResponse(SecondarySource row, PrimarySource primarySource) {
        SecondarySourceResponse res = new SecondarySourceResponse();
        res.setId(row.getId());
        res.setSecondaryId(row.getSecondaryId());
        res.setSecondarySource(row.getSourceName());
        res.setPrimarySourceId(primarySource == null ? row.getPrimarySourceId() : primarySource.getId());
        res.setPrimarySource(primarySource == null ? null : primarySource.getSourceName());
        res.setCreatedDate(row.getCreatedAt());
        return res;
    }
}
