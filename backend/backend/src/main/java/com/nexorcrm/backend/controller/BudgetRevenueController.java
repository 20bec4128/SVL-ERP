package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.BudgetRevenueRequest;
import com.nexorcrm.backend.dto.BudgetRevenueResponse;
import com.nexorcrm.backend.service.BudgetRevenueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budget-revenues")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class BudgetRevenueController {

    private final BudgetRevenueService service;

    public BudgetRevenueController(BudgetRevenueService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<BudgetRevenueResponse>> list() {
        return ResponseEntity.ok(service.list());
    }

    @PostMapping
    public ResponseEntity<BudgetRevenueResponse> create(@Valid @RequestBody BudgetRevenueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetRevenueResponse> update(@PathVariable Long id, @Valid @RequestBody BudgetRevenueRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
