package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.TicketCategoryRequest;
import com.nexorcrm.backend.dto.TicketCategoryResponse;
import com.nexorcrm.backend.service.TicketCategoryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ticket-categories")
public class TicketCategoryController {

    private final TicketCategoryService service;

    public TicketCategoryController(TicketCategoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<TicketCategoryResponse> list() {
        return service.list();
    }

    @PostMapping
    public TicketCategoryResponse create(@Valid @RequestBody TicketCategoryRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public TicketCategoryResponse update(@PathVariable Long id, @Valid @RequestBody TicketCategoryRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
