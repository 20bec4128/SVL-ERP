package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.PrimarySourceRequest;
import com.nexorcrm.backend.dto.PrimarySourceResponse;
import com.nexorcrm.backend.service.PrimarySourceService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/primary-sources")
public class PrimarySourceController {

    private final PrimarySourceService primarySourceService;

    public PrimarySourceController(PrimarySourceService primarySourceService) {
        this.primarySourceService = primarySourceService;
    }

    @GetMapping
    public List<PrimarySourceResponse> list(Authentication authentication) {
        return primarySourceService.list(authentication.getName());
    }

    @PostMapping
    public PrimarySourceResponse create(@Valid @RequestBody PrimarySourceRequest request,
                                        Authentication authentication) {
        return primarySourceService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public PrimarySourceResponse update(@PathVariable("id") Long id,
                                        @Valid @RequestBody PrimarySourceRequest request,
                                        Authentication authentication) {
        return primarySourceService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable("id") Long id, Authentication authentication) {
        primarySourceService.delete(id, authentication.getName());
        return new ApiMessageResponse("Primary source deleted successfully");
    }
}
