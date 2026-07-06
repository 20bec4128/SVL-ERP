package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.LeadStatusRequest;
import com.nexorcrm.backend.dto.LeadStatusResponse;
import com.nexorcrm.backend.entity.LeadStatus;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.LeadStatusRepository;
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
public class LeadStatusService {

    private final LeadStatusRepository leadStatusRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public LeadStatusService(LeadStatusRepository leadStatusRepository,
                             UserRepository userRepository,
                             AuditService auditService) {
        this.leadStatusRepository = leadStatusRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<LeadStatusResponse> list(String actorPrincipal) {
        resolveActor(actorPrincipal);
        return leadStatusRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public LeadStatusResponse create(LeadStatusRequest request, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);

        String name = request.getLeadStatus().trim();
        if (leadStatusRepository.existsByStatusNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalStateException("Lead status already exists");
        }

        LeadStatus row = new LeadStatus();
        row.setStatusId(generateStatusId());
        row.setStatusName(name);

        LeadStatus saved = leadStatusRepository.save(row);
        auditService.log("LEAD_STATUS_CREATE", "Created lead status", actor.getEmail());
        return toResponse(saved);
    }

    public LeadStatusResponse update(Long id, LeadStatusRequest request, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);
        LeadStatus row = leadStatusRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead status not found"));

        String name = request.getLeadStatus().trim();
        if (leadStatusRepository.existsByStatusNameIgnoreCaseAndDeletedFalseAndIdNot(name, id)) {
            throw new IllegalStateException("Lead status already exists");
        }

        row.setStatusName(name);
        LeadStatus saved = leadStatusRepository.save(row);
        auditService.log("LEAD_STATUS_UPDATE", "Updated lead status", actor.getEmail());
        return toResponse(saved);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = assertAllowed(actorPrincipal);
        LeadStatus row = leadStatusRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead status not found"));

        row.setDeleted(true);
        leadStatusRepository.save(row);
        auditService.log("LEAD_STATUS_DELETE", "Deleted lead status", actor.getEmail());
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

    private String generateStatusId() {
        return "LDSTS_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
    }

    private LeadStatusResponse toResponse(LeadStatus row) {
        LeadStatusResponse res = new LeadStatusResponse();
        res.setId(row.getId());
        res.setStatusId(row.getStatusId());
        res.setLeadStatus(row.getStatusName());
        res.setCreatedDate(row.getCreatedAt());
        return res;
    }
}
