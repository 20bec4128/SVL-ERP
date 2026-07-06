package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.GoalTrackingRequest;
import com.nexorcrm.backend.dto.GoalTrackingResponse;
import com.nexorcrm.backend.service.GoalTrackingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goal-tracking")
public class GoalTrackingController {

    private final GoalTrackingService service;

    public GoalTrackingController(GoalTrackingService service) {
        this.service = service;
    }

    @GetMapping
    public List<GoalTrackingResponse> listAll() {
        return service.listAll();
    }

    @PostMapping
    public GoalTrackingResponse create(@Valid @RequestBody GoalTrackingRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public GoalTrackingResponse update(@PathVariable Long id, @Valid @RequestBody GoalTrackingRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
