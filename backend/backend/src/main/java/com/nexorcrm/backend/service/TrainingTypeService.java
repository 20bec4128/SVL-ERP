package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.TrainingTypeRequest;
import com.nexorcrm.backend.dto.TrainingTypeResponse;
import com.nexorcrm.backend.entity.TrainingType;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.TrainingTypeRepository;
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
public class TrainingTypeService {

    private final TrainingTypeRepository trainingTypeRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public TrainingTypeService(TrainingTypeRepository trainingTypeRepository,
                               UserRepository userRepository,
                               AuditService auditService) {
        this.trainingTypeRepository = trainingTypeRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<TrainingTypeResponse> list(String actorPrincipal) {
        resolveActor(actorPrincipal);
        return trainingTypeRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public TrainingTypeResponse create(TrainingTypeRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        String name = request.getTrainingType().trim();
        if (trainingTypeRepository.existsByTypeNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalStateException("Training type already exists");
        }

        TrainingType row = new TrainingType();
        row.setTypeId("TRTYP_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14));
        row.setTypeName(name);
        row.setDescription(cleanDescription(request.getDescription()));
        row.setActive(parseActive(request.getStatus()));

        TrainingType saved = trainingTypeRepository.save(row);
        auditService.log("TRAINING_TYPE_CREATE", "Created training type", actor.getEmail());
        return toResponse(saved);
    }

    public TrainingTypeResponse update(Long id, TrainingTypeRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        TrainingType row = trainingTypeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Training type not found"));

        String name = request.getTrainingType().trim();
        if (trainingTypeRepository.existsByTypeNameIgnoreCaseAndDeletedFalseAndIdNot(name, id)) {
            throw new IllegalStateException("Training type already exists");
        }

        row.setTypeName(name);
        row.setDescription(cleanDescription(request.getDescription()));
        row.setActive(parseActive(request.getStatus()));
        TrainingType saved = trainingTypeRepository.save(row);
        auditService.log("TRAINING_TYPE_UPDATE", "Updated training type", actor.getEmail());
        return toResponse(saved);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        TrainingType row = trainingTypeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Training type not found"));

        row.setDeleted(true);
        trainingTypeRepository.save(row);
        auditService.log("TRAINING_TYPE_DELETE", "Deleted training type", actor.getEmail());
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

    private boolean parseActive(String status) {
        if (!StringUtils.hasText(status)) return true;
        return !"inactive".equalsIgnoreCase(status.trim());
    }

    private String cleanDescription(String description) {
        if (!StringUtils.hasText(description)) return null;
        return description.trim();
    }

    private TrainingTypeResponse toResponse(TrainingType row) {
        TrainingTypeResponse res = new TrainingTypeResponse();
        res.setId(row.getId());
        res.setTypeId(row.getTypeId());
        res.setTrainingType(row.getTypeName());
        res.setDescription(row.getDescription());
        res.setStatus(row.isActive() ? "Active" : "Inactive");
        res.setCreatedDate(row.getCreatedAt());
        return res;
    }
}
