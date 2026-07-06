package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.EmailTemplateResponse;
import com.nexorcrm.backend.dto.EmailTemplateUpsertRequest;
import com.nexorcrm.backend.service.EmailTemplateService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email-templates")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','TEAM_LEAD','EMPLOYEE')")
public class EmailTemplateController {

    private final EmailTemplateService service;

    public EmailTemplateController(EmailTemplateService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> getAll() {
        return service.getAll();
    }

    @GetMapping("/{templateKey}")
    public EmailTemplateResponse getOne(@PathVariable String templateKey) {
        return service.getOne(templateKey);
    }

    @PostMapping
    public EmailTemplateResponse create(@RequestBody EmailTemplateUpsertRequest request) {
        return service.create(request);
    }

    @PutMapping("/{templateKey}")
    public EmailTemplateResponse save(
            @PathVariable String templateKey,
            @RequestBody EmailTemplateUpsertRequest request
    ) {
        return service.save(templateKey, request);
    }

    @DeleteMapping("/{templateKey}")
    public void delete(@PathVariable String templateKey) {
        service.delete(templateKey);
    }
}
