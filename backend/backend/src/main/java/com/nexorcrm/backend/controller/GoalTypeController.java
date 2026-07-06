package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.GoalTypeRequest;
import com.nexorcrm.backend.dto.GoalTypeResponse;
import com.nexorcrm.backend.service.GoalTypeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goal-types")
public class GoalTypeController {

    private final GoalTypeService service;

    public GoalTypeController(GoalTypeService service) {
        this.service = service;
    }

    @GetMapping
    public List<GoalTypeResponse> listAll() {
        return service.listAll();
    }

    @PostMapping
    public GoalTypeResponse create(@Valid @RequestBody GoalTypeRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public GoalTypeResponse update(@PathVariable Long id, @Valid @RequestBody GoalTypeRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
