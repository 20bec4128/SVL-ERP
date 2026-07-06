package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.DepartmentMasterRequest;
import com.nexorcrm.backend.dto.DepartmentMasterResponse;
import com.nexorcrm.backend.service.DepartmentMasterService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentMasterController {

    private final DepartmentMasterService service;

    public DepartmentMasterController(DepartmentMasterService service) {
        this.service = service;
    }

    @GetMapping
    public List<DepartmentMasterResponse> list(@RequestParam(value = "branchId", required = false) Long branchId) {
        return service.list(branchId);
    }

    @PostMapping
    public DepartmentMasterResponse create(@Valid @RequestBody DepartmentMasterRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public DepartmentMasterResponse update(@PathVariable Long id, @Valid @RequestBody DepartmentMasterRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
