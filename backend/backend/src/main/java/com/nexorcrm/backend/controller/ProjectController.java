package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.ProjectRequest;
import com.nexorcrm.backend.dto.ProjectResponse;
import com.nexorcrm.backend.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<ProjectResponse> list(Authentication authentication) {
        return projectService.list(authentication.getName());
    }

    @PostMapping
    public ProjectResponse create(@Valid @RequestBody ProjectRequest request,
                                  Authentication authentication) {
        return projectService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public ProjectResponse update(@PathVariable("id") Long id,
                                  @Valid @RequestBody ProjectRequest request,
                                  Authentication authentication) {
        return projectService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable("id") Long id, Authentication authentication) {
        projectService.delete(id, authentication.getName());
        return new ApiMessageResponse("Project deleted successfully");
    }
}
