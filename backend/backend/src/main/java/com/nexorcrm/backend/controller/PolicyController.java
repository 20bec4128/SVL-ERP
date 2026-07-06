package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.PolicyRequest;
import com.nexorcrm.backend.dto.PolicyResponse;
import com.nexorcrm.backend.entity.Policy;
import com.nexorcrm.backend.service.PolicyService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {

    private final PolicyService policyService;

    public PolicyController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @GetMapping
    public List<PolicyResponse> list() {
        return policyService.list();
    }

    @PostMapping(consumes = "multipart/form-data")
    public PolicyResponse create(
            @Valid @RequestPart("data") PolicyRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return policyService.create(request, file);
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public PolicyResponse update(
            @PathVariable Long id,
            @Valid @RequestPart("data") PolicyRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return policyService.update(id, request, file);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        policyService.delete(id);
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        Policy p = policyService.getPolicy(id);
        Resource resource = policyService.getFileResource(id);
        String contentType = p.getFileType() == null || p.getFileType().isBlank()
                ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                : p.getFileType();
        String filename = p.getFileName() == null ? "policy-file" : p.getFileName();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
