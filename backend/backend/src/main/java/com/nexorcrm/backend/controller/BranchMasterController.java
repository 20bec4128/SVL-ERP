package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.BranchMasterRequest;
import com.nexorcrm.backend.dto.BranchMasterResponse;
import com.nexorcrm.backend.service.BranchMasterService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
public class BranchMasterController {

    private final BranchMasterService service;

    public BranchMasterController(BranchMasterService service) {
        this.service = service;
    }

    @GetMapping
    public List<BranchMasterResponse> list(@RequestParam(value = "headOfficeId", required = false) Long headOfficeId) {
        return service.list(headOfficeId);
    }

    @PostMapping
    public BranchMasterResponse create(@Valid @RequestBody BranchMasterRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public BranchMasterResponse update(@PathVariable Long id, @Valid @RequestBody BranchMasterRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}

