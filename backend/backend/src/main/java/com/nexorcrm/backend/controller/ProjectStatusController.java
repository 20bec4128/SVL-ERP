package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.ProjectStatusRequest;
import com.nexorcrm.backend.dto.ProjectStatusResponse;
import com.nexorcrm.backend.service.ProjectStatusService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-statuses")
public class ProjectStatusController {

    private final ProjectStatusService projectStatusService;

    public ProjectStatusController(ProjectStatusService projectStatusService) {
        this.projectStatusService = projectStatusService;
    }

    @GetMapping
    public List<ProjectStatusResponse> list(Authentication authentication) {
        return projectStatusService.list(authentication.getName());
    }

    @PostMapping
    public ProjectStatusResponse create(@Valid @RequestBody ProjectStatusRequest request, Authentication authentication) {
        return projectStatusService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public ProjectStatusResponse update(@PathVariable("id") Long id,
                                        @Valid @RequestBody ProjectStatusRequest request,
                                        Authentication authentication) {
        return projectStatusService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable("id") Long id, Authentication authentication) {
        projectStatusService.delete(id, authentication.getName());
        return new ApiMessageResponse("Project status deleted successfully");
    }
}
