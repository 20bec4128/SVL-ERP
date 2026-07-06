package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.ProjectTypeRequest;
import com.nexorcrm.backend.dto.ProjectTypeResponse;
import com.nexorcrm.backend.service.ProjectTypeService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-types")
public class ProjectTypeController {

    private final ProjectTypeService projectTypeService;

    public ProjectTypeController(ProjectTypeService projectTypeService) {
        this.projectTypeService = projectTypeService;
    }

    @GetMapping
    public List<ProjectTypeResponse> list(Authentication authentication) {
        return projectTypeService.list(authentication.getName());
    }

    @PostMapping
    public ProjectTypeResponse create(@Valid @RequestBody ProjectTypeRequest request, Authentication authentication) {
        return projectTypeService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public ProjectTypeResponse update(@PathVariable("id") Long id,
                                      @Valid @RequestBody ProjectTypeRequest request,
                                      Authentication authentication) {
        return projectTypeService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable("id") Long id, Authentication authentication) {
        projectTypeService.delete(id, authentication.getName());
        return new ApiMessageResponse("Project type deleted successfully");
    }
}
