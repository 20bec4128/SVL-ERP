package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.ProjectStatusRequest;
import com.nexorcrm.backend.dto.ProjectStatusResponse;
import com.nexorcrm.backend.entity.ProjectStatus;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.ProjectStatusRepository;
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
public class ProjectStatusService {

    private final ProjectStatusRepository projectStatusRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public ProjectStatusService(ProjectStatusRepository projectStatusRepository,
                                UserRepository userRepository,
                                AuditService auditService) {
        this.projectStatusRepository = projectStatusRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ProjectStatusResponse> list(String actorPrincipal) {
        resolveActor(actorPrincipal);
        return projectStatusRepository.findByDeletedFalseOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public ProjectStatusResponse create(ProjectStatusRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        String name = request.getProjectStatus().trim();
        if (projectStatusRepository.existsByStatusNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalStateException("Project status already exists");
        }

        ProjectStatus row = new ProjectStatus();
        row.setStatusId("PRSTS_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14));
        row.setStatusName(name);

        ProjectStatus saved = projectStatusRepository.save(row);
        auditService.log("PROJECT_STATUS_CREATE", "Created project status", actor.getEmail());
        return toResponse(saved);
    }

    public ProjectStatusResponse update(Long id, ProjectStatusRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        ProjectStatus row = projectStatusRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Project status not found"));

        String name = request.getProjectStatus().trim();
        if (projectStatusRepository.existsByStatusNameIgnoreCaseAndDeletedFalseAndIdNot(name, id)) {
            throw new IllegalStateException("Project status already exists");
        }

        row.setStatusName(name);
        ProjectStatus saved = projectStatusRepository.save(row);
        auditService.log("PROJECT_STATUS_UPDATE", "Updated project status", actor.getEmail());
        return toResponse(saved);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        ProjectStatus row = projectStatusRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Project status not found"));

        row.setDeleted(true);
        projectStatusRepository.save(row);
        auditService.log("PROJECT_STATUS_DELETE", "Deleted project status", actor.getEmail());
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

    private ProjectStatusResponse toResponse(ProjectStatus row) {
        ProjectStatusResponse res = new ProjectStatusResponse();
        res.setId(row.getId());
        res.setStatusId(row.getStatusId());
        res.setProjectStatus(row.getStatusName());
        res.setCreatedDate(row.getCreatedAt());
        return res;
    }
}
