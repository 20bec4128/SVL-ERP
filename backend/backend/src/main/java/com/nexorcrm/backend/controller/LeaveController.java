package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.LeaveRequest;
import com.nexorcrm.backend.dto.LeaveResponse;
import com.nexorcrm.backend.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService service;

    public LeaveController(LeaveService service) {
        this.service = service;
    }

    @GetMapping
    public List<LeaveResponse> list() {
        return service.list();
    }

    @PostMapping
    public LeaveResponse create(@Valid @RequestBody LeaveRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public LeaveResponse update(@PathVariable Long id, 
                               @Valid @RequestBody LeaveRequest request,
                               org.springframework.security.core.Authentication auth) {
        String actorEmail = auth != null ? auth.getName() : null;
        return service.update(id, request, actorEmail);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
