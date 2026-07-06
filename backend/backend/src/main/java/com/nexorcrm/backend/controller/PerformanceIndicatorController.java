package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.PerformanceIndicatorRequest;
import com.nexorcrm.backend.dto.PerformanceIndicatorResponse;
import com.nexorcrm.backend.service.PerformanceIndicatorService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/performance-indicators")
public class PerformanceIndicatorController {

    private final PerformanceIndicatorService service;

    public PerformanceIndicatorController(PerformanceIndicatorService service) {
        this.service = service;
    }

    @GetMapping
    public List<PerformanceIndicatorResponse> list() {
        return service.list();
    }

    @PostMapping
    public PerformanceIndicatorResponse create(@Valid @RequestBody PerformanceIndicatorRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public PerformanceIndicatorResponse update(@PathVariable Long id, @Valid @RequestBody PerformanceIndicatorRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
