package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.service.PayslipTemplateService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payslip-template")
public class PayslipTemplateController {

    private final PayslipTemplateService service;

    public PayslipTemplateController(PayslipTemplateService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> get() {
        return service.get();
    }

    @PostMapping
    public Map<String, Object> save(@RequestBody Map<String, Object> payload) {
        return service.save(payload);
    }
}
