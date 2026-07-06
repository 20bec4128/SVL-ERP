package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.ProjectTypeRequest;
import com.nexorcrm.backend.dto.ProjectTypeResponse;
import com.nexorcrm.backend.entity.ProjectType;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.ProjectTypeRepository;
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
public class ProjectTypeService {

    private final ProjectTypeRepository projectTypeRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public ProjectTypeService(ProjectTypeRepository projectTypeRepository,
                              UserRepository userRepository,
                              AuditService auditService) {
        this.projectTypeRepository = projectTypeRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ProjectTypeResponse> list(String actorPrincipal) {
        resolveActor(actorPrincipal);
        return projectTypeRepository.findByDeletedFalseOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public ProjectTypeResponse create(ProjectTypeRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        String name = request.getProjectType().trim();
        if (projectTypeRepository.existsByTypeNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalStateException("Project type already exists");
        }

        ProjectType row = new ProjectType();
        row.setTypeId("PRTYP_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14));
        row.setTypeName(name);

        ProjectType saved = projectTypeRepository.save(row);
        auditService.log("PROJECT_TYPE_CREATE", "Created project type", actor.getEmail());
        return toResponse(saved);
    }

    public ProjectTypeResponse update(Long id, ProjectTypeRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        ProjectType row = projectTypeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Project type not found"));

        String name = request.getProjectType().trim();
        if (projectTypeRepository.existsByTypeNameIgnoreCaseAndDeletedFalseAndIdNot(name, id)) {
            throw new IllegalStateException("Project type already exists");
        }

        row.setTypeName(name);
        ProjectType saved = projectTypeRepository.save(row);
        auditService.log("PROJECT_TYPE_UPDATE", "Updated project type", actor.getEmail());
        return toResponse(saved);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        ProjectType row = projectTypeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Project type not found"));

        row.setDeleted(true);
        projectTypeRepository.save(row);
        auditService.log("PROJECT_TYPE_DELETE", "Deleted project type", actor.getEmail());
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

    private ProjectTypeResponse toResponse(ProjectType row) {
        ProjectTypeResponse res = new ProjectTypeResponse();
        res.setId(row.getId());
        res.setTypeId(row.getTypeId());
        res.setProjectType(row.getTypeName());
        res.setCreatedDate(row.getCreatedAt());
        return res;
    }
}
