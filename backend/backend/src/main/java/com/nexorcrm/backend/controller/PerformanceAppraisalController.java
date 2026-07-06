package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.PerformanceAppraisalRequest;
import com.nexorcrm.backend.dto.PerformanceAppraisalResponse;
import com.nexorcrm.backend.service.PerformanceAppraisalService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/performance-appraisals")
public class PerformanceAppraisalController {

    private final PerformanceAppraisalService service;

    public PerformanceAppraisalController(PerformanceAppraisalService service) {
        this.service = service;
    }

    @GetMapping
    public List<PerformanceAppraisalResponse> listAll() {
        return service.listAll();
    }

    @PostMapping
    public PerformanceAppraisalResponse create(@Valid @RequestBody PerformanceAppraisalRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public PerformanceAppraisalResponse update(@PathVariable Long id, @Valid @RequestBody PerformanceAppraisalRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
