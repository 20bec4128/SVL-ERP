package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.LeadTypeRequest;
import com.nexorcrm.backend.dto.LeadTypeResponse;
import com.nexorcrm.backend.entity.LeadType;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.LeadTypeRepository;
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
public class LeadTypeService {

    private final LeadTypeRepository leadTypeRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public LeadTypeService(LeadTypeRepository leadTypeRepository,
                           UserRepository userRepository,
                           AuditService auditService) {
        this.leadTypeRepository = leadTypeRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<LeadTypeResponse> list(String actorPrincipal) {
        resolveActor(actorPrincipal);
        return leadTypeRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public LeadTypeResponse create(LeadTypeRequest request, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);

        String name = request.getLeadType().trim();
        if (leadTypeRepository.existsByTypeNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalStateException("Lead type already exists");
        }

        LeadType row = new LeadType();
        row.setTypeId(generateTypeId());
        row.setTypeName(name);

        LeadType saved = leadTypeRepository.save(row);
        auditService.log("LEAD_TYPE_CREATE", "Created lead type", actor.getEmail());
        return toResponse(saved);
    }

    public LeadTypeResponse update(Long id, LeadTypeRequest request, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);
        LeadType row = leadTypeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead type not found"));

        String name = request.getLeadType().trim();
        if (leadTypeRepository.existsByTypeNameIgnoreCaseAndDeletedFalseAndIdNot(name, id)) {
            throw new IllegalStateException("Lead type already exists");
        }

        row.setTypeName(name);
        LeadType saved = leadTypeRepository.save(row);
        auditService.log("LEAD_TYPE_UPDATE", "Updated lead type", actor.getEmail());
        return toResponse(saved);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);
        LeadType row = leadTypeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead type not found"));

        row.setDeleted(true);
        leadTypeRepository.save(row);
        auditService.log("LEAD_TYPE_DELETE", "Deleted lead type", actor.getEmail());
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

    private String generateTypeId() {
        return "LDTYP_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
    }

    private LeadTypeResponse toResponse(LeadType row) {
        LeadTypeResponse res = new LeadTypeResponse();
        res.setId(row.getId());
        res.setTypeId(row.getTypeId());
        res.setLeadType(row.getTypeName());
        res.setCreatedDate(row.getCreatedAt());
        return res;
    }
}
