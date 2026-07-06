package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.TertiarySourceRequest;
import com.nexorcrm.backend.dto.TertiarySourceResponse;
import com.nexorcrm.backend.entity.TertiarySource;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.TertiarySourceRepository;
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
public class TertiarySourceService {

    private final TertiarySourceRepository tertiarySourceRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public TertiarySourceService(TertiarySourceRepository tertiarySourceRepository,
                                 UserRepository userRepository,
                                 AuditService auditService) {
        this.tertiarySourceRepository = tertiarySourceRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<TertiarySourceResponse> list(String actorPrincipal) {
        resolveActor(actorPrincipal);
        return tertiarySourceRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TertiarySourceResponse create(TertiarySourceRequest request, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);

        String name = request.getTertiarySource().trim();
        if (tertiarySourceRepository.existsBySourceNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalStateException("Tertiary source already exists");
        }

        TertiarySource row = new TertiarySource();
        row.setTertiaryId(generateTertiaryId());
        row.setSourceName(name);

        TertiarySource saved = tertiarySourceRepository.save(row);
        auditService.log("TERTIARY_SOURCE_CREATE", "Created tertiary source", actor.getEmail());
        return toResponse(saved);
    }

    public TertiarySourceResponse update(Long id, TertiarySourceRequest request, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);
        TertiarySource row = tertiarySourceRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Tertiary source not found"));

        String name = request.getTertiarySource().trim();
        if (tertiarySourceRepository.existsBySourceNameIgnoreCaseAndDeletedFalseAndIdNot(name, id)) {
            throw new IllegalStateException("Tertiary source already exists");
        }

        row.setSourceName(name);
        TertiarySource saved = tertiarySourceRepository.save(row);
        auditService.log("TERTIARY_SOURCE_UPDATE", "Updated tertiary source", actor.getEmail());
        return toResponse(saved);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);
        TertiarySource row = tertiarySourceRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Tertiary source not found"));

        row.setDeleted(true);
        tertiarySourceRepository.save(row);
        auditService.log("TERTIARY_SOURCE_DELETE", "Deleted tertiary source", actor.getEmail());
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

    private String generateTertiaryId() {
        return "TERSO_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
    }

    private TertiarySourceResponse toResponse(TertiarySource row) {
        TertiarySourceResponse res = new TertiarySourceResponse();
        res.setId(row.getId());
        res.setTertiaryId(row.getTertiaryId());
        res.setTertiarySource(row.getSourceName());
        res.setCreatedDate(row.getCreatedAt());
        return res;
    }
}
