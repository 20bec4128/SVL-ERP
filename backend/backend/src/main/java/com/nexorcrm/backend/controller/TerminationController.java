package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.TerminationRequest;
import com.nexorcrm.backend.dto.TerminationResponse;
import com.nexorcrm.backend.service.TerminationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/terminations")
public class TerminationController {

    private final TerminationService terminationService;

    public TerminationController(TerminationService terminationService) {
        this.terminationService = terminationService;
    }

    @GetMapping
    public List<TerminationResponse> list() {
        return terminationService.list();
    }

    @PostMapping
    public TerminationResponse create(@Valid @RequestBody TerminationRequest request) {
        return terminationService.create(request);
    }

    @PutMapping("/{id}")
    public TerminationResponse update(@PathVariable Long id, @Valid @RequestBody TerminationRequest request) {
        return terminationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        terminationService.delete(id);
    }
}
