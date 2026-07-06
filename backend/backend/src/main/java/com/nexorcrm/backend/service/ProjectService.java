package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.ProjectRequest;
import com.nexorcrm.backend.dto.ProjectResponse;
import com.nexorcrm.backend.entity.Project;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.ProjectRepository;
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
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public ProjectService(ProjectRepository projectRepository,
                          UserRepository userRepository,
                          AuditService auditService) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(String actorPrincipal) {
        resolveActor(actorPrincipal);
        return projectRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProjectResponse create(ProjectRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        String name = request.getProjectName().trim();
        if (projectRepository.existsByProjectNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalStateException("Project already exists");
        }

        Project row = new Project();
        row.setProjectId("PRJ_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase(Locale.ROOT));
        row.setProjectName(name);
        row.setProjectLocation(normalizeNullable(request.getProjectLocation()));
        row.setProjectType(request.getProjectType().trim());
        row.setProjectStatus(request.getProjectStatus().trim());
        row.setDescription(normalizeNullable(request.getDescription()));

        Project saved = projectRepository.save(row);
        auditService.log("PROJECT_CREATE", "Created project", actor.getEmail());
        return toResponse(saved);
    }

    public ProjectResponse update(Long id, ProjectRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        Project row = projectRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found"));

        String name = request.getProjectName().trim();
        if (projectRepository.existsByProjectNameIgnoreCaseAndDeletedFalseAndIdNot(name, id)) {
            throw new IllegalStateException("Project already exists");
        }

        row.setProjectName(name);
        row.setProjectLocation(normalizeNullable(request.getProjectLocation()));
        row.setProjectType(request.getProjectType().trim());
        row.setProjectStatus(request.getProjectStatus().trim());
        row.setDescription(normalizeNullable(request.getDescription()));

        Project saved = projectRepository.save(row);
        auditService.log("PROJECT_UPDATE", "Updated project", actor.getEmail());
        return toResponse(saved);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        Project row = projectRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found"));

        row.setDeleted(true);
        projectRepository.save(row);
        auditService.log("PROJECT_DELETE", "Deleted project", actor.getEmail());
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

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private ProjectResponse toResponse(Project row) {
        ProjectResponse res = new ProjectResponse();
        res.setId(row.getId());
        res.setProjectId(row.getProjectId());
        res.setProjectName(row.getProjectName());
        res.setProjectLocation(row.getProjectLocation());
        res.setProjectType(row.getProjectType());
        res.setProjectStatus(row.getProjectStatus());
        res.setCreatedDate(row.getCreatedAt());
        res.setDescription(row.getDescription());
        return res;
    }
}
