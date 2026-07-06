package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.EmployeeSalaryRequest;
import com.nexorcrm.backend.dto.EmployeeSalaryResponse;
import com.nexorcrm.backend.service.EmployeeSalaryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employee-salaries")
public class EmployeeSalaryController {

    private final EmployeeSalaryService service;

    public EmployeeSalaryController(EmployeeSalaryService service) {
        this.service = service;
    }

    @GetMapping
    public List<EmployeeSalaryResponse> list() {
        return service.list();
    }

    @PostMapping
    public EmployeeSalaryResponse create(@Valid @RequestBody EmployeeSalaryRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public EmployeeSalaryResponse update(@PathVariable Long id, @Valid @RequestBody EmployeeSalaryRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
