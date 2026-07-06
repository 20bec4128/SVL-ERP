package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.TicketRequest;
import com.nexorcrm.backend.dto.TicketResponse;
import com.nexorcrm.backend.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService service;

    public TicketController(TicketService service) {
        this.service = service;
    }

    @GetMapping
    public List<TicketResponse> list() {
        return service.list();
    }

    @PostMapping
    public TicketResponse create(@Valid @RequestBody TicketRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public TicketResponse update(@PathVariable Long id, @Valid @RequestBody TicketRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
