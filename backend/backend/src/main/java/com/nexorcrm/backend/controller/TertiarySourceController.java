package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.TertiarySourceRequest;
import com.nexorcrm.backend.dto.TertiarySourceResponse;
import com.nexorcrm.backend.service.TertiarySourceService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tertiary-sources")
public class TertiarySourceController {

    private final TertiarySourceService tertiarySourceService;

    public TertiarySourceController(TertiarySourceService tertiarySourceService) {
        this.tertiarySourceService = tertiarySourceService;
    }

    @GetMapping
    public List<TertiarySourceResponse> list(Authentication authentication) {
        return tertiarySourceService.list(authentication.getName());
    }

    @PostMapping
    public TertiarySourceResponse create(@Valid @RequestBody TertiarySourceRequest request,
                                         Authentication authentication) {
        return tertiarySourceService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public TertiarySourceResponse update(@PathVariable("id") Long id,
                                         @Valid @RequestBody TertiarySourceRequest request,
                                         Authentication authentication) {
        return tertiarySourceService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable("id") Long id, Authentication authentication) {
        tertiarySourceService.delete(id, authentication.getName());
        return new ApiMessageResponse("Tertiary source deleted successfully");
    }
}
