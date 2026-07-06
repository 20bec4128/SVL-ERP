package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.entity.PayrollAddition;
import com.nexorcrm.backend.entity.PayrollDeduction;
import com.nexorcrm.backend.entity.PayrollOvertime;
import com.nexorcrm.backend.service.PayrollItemsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll-items")
public class PayrollItemsController {

    private final PayrollItemsService service;

    public PayrollItemsController(PayrollItemsService service) {
        this.service = service;
    }

    // Additions Endpoints
    @GetMapping("/additions")
    public List<PayrollAddition> listAdditions() {
        return service.listAdditions();
    }

    @PostMapping("/additions")
    public PayrollAddition createAddition(@Valid @RequestBody PayrollAddition addition) {
        return service.createAddition(addition);
    }

    @PutMapping("/additions/{id}")
    public PayrollAddition updateAddition(@PathVariable Long id, @Valid @RequestBody PayrollAddition addition) {
        return service.updateAddition(id, addition);
    }

    @DeleteMapping("/additions/{id}")
    public void deleteAddition(@PathVariable Long id) {
        service.deleteAddition(id);
    }

    // Overtimes Endpoints
    @GetMapping("/overtimes")
    public List<PayrollOvertime> listOvertimes() {
        return service.listOvertimes();
    }

    @PostMapping("/overtimes")
    public PayrollOvertime createOvertime(@Valid @RequestBody PayrollOvertime overtime) {
        return service.createOvertime(overtime);
    }

    @PutMapping("/overtimes/{id}")
    public PayrollOvertime updateOvertime(@PathVariable Long id, @Valid @RequestBody PayrollOvertime overtime) {
        return service.updateOvertime(id, overtime);
    }

    @DeleteMapping("/overtimes/{id}")
    public void deleteOvertime(@PathVariable Long id) {
        service.deleteOvertime(id);
    }

    // Deductions Endpoints
    @GetMapping("/deductions")
    public List<PayrollDeduction> listDeductions() {
        return service.listDeductions();
    }

    @PostMapping("/deductions")
    public PayrollDeduction createDeduction(@Valid @RequestBody PayrollDeduction deduction) {
        return service.createDeduction(deduction);
    }

    @PutMapping("/deductions/{id}")
    public PayrollDeduction updateDeduction(@PathVariable Long id, @Valid @RequestBody PayrollDeduction deduction) {
        return service.updateDeduction(id, deduction);
    }

    @DeleteMapping("/deductions/{id}")
    public void deleteDeduction(@PathVariable Long id) {
        service.deleteDeduction(id);
    }
}
