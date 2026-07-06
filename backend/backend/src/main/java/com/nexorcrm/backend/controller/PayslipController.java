package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.PayslipRequest;
import com.nexorcrm.backend.dto.PayslipResponse;
import com.nexorcrm.backend.service.PayslipService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payslips")
public class PayslipController {

    private final PayslipService service;

    public PayslipController(PayslipService service) {
        this.service = service;
    }

    @GetMapping
    public List<PayslipResponse> list() {
        return service.list();
    }

    @PostMapping
    public PayslipResponse create(@Valid @RequestBody PayslipRequest request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
