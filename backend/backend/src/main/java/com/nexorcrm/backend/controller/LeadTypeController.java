package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.LeadTypeRequest;
import com.nexorcrm.backend.dto.LeadTypeResponse;
import com.nexorcrm.backend.service.LeadTypeService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lead-types")
public class LeadTypeController {

    private final LeadTypeService leadTypeService;

    public LeadTypeController(LeadTypeService leadTypeService) {
        this.leadTypeService = leadTypeService;
    }

    @GetMapping
    public List<LeadTypeResponse> list(Authentication authentication) {
        return leadTypeService.list(authentication.getName());
    }

    @PostMapping
    public LeadTypeResponse create(@Valid @RequestBody LeadTypeRequest request,
                                   Authentication authentication) {
        return leadTypeService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public LeadTypeResponse update(@PathVariable("id") Long id,
                                   @Valid @RequestBody LeadTypeRequest request,
                                   Authentication authentication) {
        return leadTypeService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable("id") Long id, Authentication authentication) {
        leadTypeService.delete(id, authentication.getName());
        return new ApiMessageResponse("Lead type deleted successfully");
    }
}
