package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.LeadStatusRequest;
import com.nexorcrm.backend.dto.LeadStatusResponse;
import com.nexorcrm.backend.service.LeadStatusService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lead-statuses")
public class LeadStatusController {

    private final LeadStatusService leadStatusService;

    public LeadStatusController(LeadStatusService leadStatusService) {
        this.leadStatusService = leadStatusService;
    }

    @GetMapping
    public List<LeadStatusResponse> list(Authentication authentication) {
        return leadStatusService.list(authentication.getName());
    }

    @PostMapping
    public LeadStatusResponse create(@Valid @RequestBody LeadStatusRequest request,
                                     Authentication authentication) {
        return leadStatusService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public LeadStatusResponse update(@PathVariable("id") Long id,
                                     @Valid @RequestBody LeadStatusRequest request,
                                     Authentication authentication) {
        return leadStatusService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable("id") Long id, Authentication authentication) {
        leadStatusService.delete(id, authentication.getName());
        return new ApiMessageResponse("Lead status deleted successfully");
    }
}
