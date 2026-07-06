package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.LeadFlowRequest;
import com.nexorcrm.backend.dto.LeadFlowResponse;
import com.nexorcrm.backend.service.DealFlowService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/deal-flow")
public class DealFlowController {

    private final DealFlowService dealFlowService;

    public DealFlowController(DealFlowService dealFlowService) {
        this.dealFlowService = dealFlowService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','EMPLOYEE')")
    public LeadFlowResponse getFlow() {
        return dealFlowService.getFlow();
    }

    @PutMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public LeadFlowResponse updateFlow(@RequestBody LeadFlowRequest request,
                                       Authentication authentication) {
        return dealFlowService.updateFlow(request, authentication == null ? null : authentication.getName());
    }
}
