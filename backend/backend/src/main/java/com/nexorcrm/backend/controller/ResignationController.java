package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ResignationRequest;
import com.nexorcrm.backend.dto.ResignationResponse;
import com.nexorcrm.backend.service.ResignationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resignations")
public class ResignationController {

    private final ResignationService resignationService;

    public ResignationController(ResignationService resignationService) {
        this.resignationService = resignationService;
    }

    @GetMapping
    public List<ResignationResponse> list() {
        return resignationService.list();
    }

    @PostMapping
    public ResignationResponse create(@Valid @RequestBody ResignationRequest request) {
        return resignationService.create(request);
    }

    @PutMapping("/{id}")
    public ResignationResponse update(@PathVariable Long id, @Valid @RequestBody ResignationRequest request) {
        return resignationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        resignationService.delete(id);
    }
}
