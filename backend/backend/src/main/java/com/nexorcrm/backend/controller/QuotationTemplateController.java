package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.service.QuotationTemplateService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quotation-template")
public class QuotationTemplateController {

    private final QuotationTemplateService service;

    public QuotationTemplateController(QuotationTemplateService service) {
        this.service = service;
    }

    // Returns the active template for backward compatibility
    @GetMapping
    public Map<String, Object> get() {
        return service.get();
    }

    // New REST endpoints for template list and management
    @GetMapping("/list")
    public List<Map<String, Object>> listAll() {
        return service.listAll();
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody Map<String, Object> payload) {
        return service.create(payload);
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return service.update(id, payload);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PutMapping("/{id}/activate")
    public Map<String, Object> activate(@PathVariable Long id) {
        return service.activate(id);
    }
}
