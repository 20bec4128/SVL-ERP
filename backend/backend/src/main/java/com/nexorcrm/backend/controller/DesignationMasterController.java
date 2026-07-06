package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.DesignationMasterRequest;
import com.nexorcrm.backend.dto.DesignationMasterResponse;
import com.nexorcrm.backend.service.DesignationMasterService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/designations")
public class DesignationMasterController {

    private final DesignationMasterService service;

    public DesignationMasterController(DesignationMasterService service) {
        this.service = service;
    }

    @GetMapping
    public List<DesignationMasterResponse> list(@RequestParam(value = "departmentId", required = false) Long departmentId) {
        return service.list(departmentId);
    }

    @PostMapping
    public DesignationMasterResponse create(@Valid @RequestBody DesignationMasterRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public DesignationMasterResponse update(@PathVariable Long id, @Valid @RequestBody DesignationMasterRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
