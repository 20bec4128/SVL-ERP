package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.TrainerRequest;
import com.nexorcrm.backend.dto.TrainerResponse;
import com.nexorcrm.backend.entity.Trainer;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.TrainerRepository;
import com.nexorcrm.backend.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class TrainerService {

    private final TrainerRepository trainerRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public TrainerService(TrainerRepository trainerRepository,
                          UserRepository userRepository,
                          AuditService auditService) {
        this.trainerRepository = trainerRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<TrainerResponse> list(String actorPrincipal) {
        resolveActor(actorPrincipal);
        return trainerRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public TrainerResponse create(TrainerRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        Trainer row = new Trainer();
        apply(row, request);
        Trainer saved = trainerRepository.save(row);
        auditService.log("TRAINER_CREATE", "Created trainer", actor.getEmail());
        return toResponse(saved);
    }

    public TrainerResponse update(Long id, TrainerRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        Trainer row = trainerRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Trainer not found"));
        apply(row, request);
        Trainer saved = trainerRepository.save(row);
        auditService.log("TRAINER_UPDATE", "Updated trainer", actor.getEmail());
        return toResponse(saved);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        Trainer row = trainerRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Trainer not found"));
        row.setDeleted(true);
        trainerRepository.save(row);
        auditService.log("TRAINER_DELETE", "Deleted trainer", actor.getEmail());
    }

    private void apply(Trainer row, TrainerRequest request) {
        row.setFirstName(request.getFirstName().trim());
        row.setLastName(request.getLastName().trim());
        row.setRole(clean(request.getRole()));
        row.setPhone(clean(request.getPhone()));
        row.setEmail(clean(request.getEmail()));
        row.setDescription(clean(request.getDescription()));
        row.setActive(parseActive(request.getStatus()));
    }

    private boolean parseActive(String status) {
        if (!StringUtils.hasText(status)) return true;
        return !"inactive".equalsIgnoreCase(status.trim());
    }

    private String clean(String v) {
        return StringUtils.hasText(v) ? v.trim() : null;
    }

    private User resolveActor(String actorPrincipal) {
        if (!StringUtils.hasText(actorPrincipal)) throw new AccessDeniedException("Unauthenticated actor");
        if (actorPrincipal.contains("@")) {
            return userRepository.findByEmailAndIsDeletedFalse(actorPrincipal.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
        }
        return userRepository.findByUsernameAndIsDeletedFalse(actorPrincipal.trim())
                .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
    }

    private TrainerResponse toResponse(Trainer row) {
        TrainerResponse res = new TrainerResponse();
        res.setId(row.getId());
        res.setFirstName(row.getFirstName());
        res.setLastName(row.getLastName());
        res.setRole(row.getRole());
        res.setPhone(row.getPhone());
        res.setEmail(row.getEmail());
        res.setDescription(row.getDescription());
        res.setStatus(row.isActive() ? "Active" : "Inactive");
        res.setCreatedDate(row.getCreatedAt());
        return res;
    }
}
