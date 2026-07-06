package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.*;
import com.nexorcrm.backend.service.BranchWorkflowConfigService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/branch-workflow-config")
public class BranchWorkflowConfigController {

    private final BranchWorkflowConfigService service;

    public BranchWorkflowConfigController(BranchWorkflowConfigService service) {
        this.service = service;
    }

    @GetMapping("/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public BranchWorkflowConfigResponse getByBranch(@PathVariable Long branchId) {
        return service.getByBranchId(branchId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public BranchWorkflowConfigResponse save(@Valid @RequestBody BranchWorkflowConfigRequest request) {
        return service.saveConfig(request);
    }

    @PostMapping("/preview")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER')")
    public BranchWorkflowPreviewResponse preview(@Valid @RequestBody BranchWorkflowPreviewRequest request) {
        return service.previewConfig(request);
    }
}
