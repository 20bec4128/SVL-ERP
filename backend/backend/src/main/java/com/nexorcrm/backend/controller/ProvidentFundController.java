package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ProvidentFundRequest;
import com.nexorcrm.backend.dto.ProvidentFundResponse;
import com.nexorcrm.backend.service.ProvidentFundService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/provident-fund")
public class ProvidentFundController {

    private final ProvidentFundService service;

    public ProvidentFundController(ProvidentFundService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProvidentFundResponse> list() {
        return service.list();
    }

    @PostMapping
    public ProvidentFundResponse create(@Valid @RequestBody ProvidentFundRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public ProvidentFundResponse update(@PathVariable Long id, @Valid @RequestBody ProvidentFundRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
