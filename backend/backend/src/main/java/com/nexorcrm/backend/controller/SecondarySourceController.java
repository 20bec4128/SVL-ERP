package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.SecondarySourceRequest;
import com.nexorcrm.backend.dto.SecondarySourceResponse;
import com.nexorcrm.backend.service.SecondarySourceService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/secondary-sources")
public class SecondarySourceController {

    private final SecondarySourceService secondarySourceService;

    public SecondarySourceController(SecondarySourceService secondarySourceService) {
        this.secondarySourceService = secondarySourceService;
    }

    @GetMapping
    public List<SecondarySourceResponse> list(Authentication authentication) {
        return secondarySourceService.list(authentication.getName());
    }

    @PostMapping
    public SecondarySourceResponse create(@Valid @RequestBody SecondarySourceRequest request,
                                          Authentication authentication) {
        return secondarySourceService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public SecondarySourceResponse update(@PathVariable("id") Long id,
                                          @Valid @RequestBody SecondarySourceRequest request,
                                          Authentication authentication) {
        return secondarySourceService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable("id") Long id, Authentication authentication) {
        secondarySourceService.delete(id, authentication.getName());
        return new ApiMessageResponse("Secondary source deleted successfully");
    }
}
