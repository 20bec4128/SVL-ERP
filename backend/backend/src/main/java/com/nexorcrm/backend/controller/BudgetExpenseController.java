package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.BudgetExpenseRequest;
import com.nexorcrm.backend.dto.BudgetExpenseResponse;
import com.nexorcrm.backend.service.BudgetExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budget-expenses")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class BudgetExpenseController {

    private final BudgetExpenseService service;

    public BudgetExpenseController(BudgetExpenseService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<BudgetExpenseResponse>> list() {
        return ResponseEntity.ok(service.list());
    }

    @PostMapping
    public ResponseEntity<BudgetExpenseResponse> create(@Valid @RequestBody BudgetExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetExpenseResponse> update(@PathVariable Long id, @Valid @RequestBody BudgetExpenseRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
