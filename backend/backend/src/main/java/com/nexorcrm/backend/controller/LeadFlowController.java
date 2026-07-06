package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.LeadFlowRequest;
import com.nexorcrm.backend.dto.LeadFlowResponse;
import com.nexorcrm.backend.service.LeadFlowService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flow")
public class LeadFlowController {

    private final LeadFlowService leadFlowService;

    public LeadFlowController(LeadFlowService leadFlowService) {
        this.leadFlowService = leadFlowService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','EMPLOYEE')")
    public LeadFlowResponse getFlow(@RequestParam(value = "branchId", required = false) Long branchId,
                                    @RequestParam(value = "institutionName", required = false) String institutionName,
                                    Authentication authentication) {
        return leadFlowService.getFlow(authentication == null ? null : authentication.getName(), branchId, institutionName);
    }

    @GetMapping("/groups")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','EMPLOYEE')")
    public List<Map<String, Object>> getFlowGroups() {
        return leadFlowService.getFlowGroups();
    }

    @PutMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public LeadFlowResponse updateFlow(@Valid @RequestBody LeadFlowRequest request,
                                       Authentication authentication) {
        return leadFlowService.updateFlow(request, authentication == null ? null : authentication.getName());
    }
}
