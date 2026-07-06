package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.SalesExpenseRequest;
import com.nexorcrm.backend.dto.SalesExpenseResponse;
import com.nexorcrm.backend.service.SalesExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales-expenses")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class SalesExpenseController {

    private final SalesExpenseService service;

    public SalesExpenseController(SalesExpenseService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SalesExpenseResponse>> list() {
        return ResponseEntity.ok(service.list());
    }

    @PostMapping
    public ResponseEntity<SalesExpenseResponse> create(@Valid @RequestBody SalesExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalesExpenseResponse> update(@PathVariable Long id, @Valid @RequestBody SalesExpenseRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
