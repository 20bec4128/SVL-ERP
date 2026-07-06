package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.HeadOfficeMasterRequest;
import com.nexorcrm.backend.dto.HeadOfficeMasterResponse;
import com.nexorcrm.backend.service.HeadOfficeMasterService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/head-offices")
public class HeadOfficeMasterController {

    private final HeadOfficeMasterService service;

    public HeadOfficeMasterController(HeadOfficeMasterService service) {
        this.service = service;
    }

    @GetMapping
    public List<HeadOfficeMasterResponse> list() {
        return service.list();
    }

    @PostMapping
    public HeadOfficeMasterResponse create(@Valid @RequestBody HeadOfficeMasterRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public HeadOfficeMasterResponse update(@PathVariable Long id, @Valid @RequestBody HeadOfficeMasterRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}

