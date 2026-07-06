package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.PromotionRequest;
import com.nexorcrm.backend.dto.PromotionResponse;
import com.nexorcrm.backend.service.PromotionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionService service;

    public PromotionController(PromotionService service) {
        this.service = service;
    }

    @GetMapping
    public List<PromotionResponse> list() {
        return service.list();
    }

    @PostMapping
    public PromotionResponse create(@Valid @RequestBody PromotionRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public PromotionResponse update(@PathVariable Long id, @Valid @RequestBody PromotionRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
