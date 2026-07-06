package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ProductFieldConfigRequest;
import com.nexorcrm.backend.dto.ProductFieldConfigResponse;
import com.nexorcrm.backend.service.ProductFieldConfigService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-types/{serviceTypeId}/fields")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductFieldConfigController {

    private final ProductFieldConfigService service;

    public ProductFieldConfigController(ProductFieldConfigService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ProductFieldConfigResponse>> getFields(@PathVariable Long serviceTypeId) {
        return ResponseEntity.ok(service.getByServiceType(serviceTypeId));
    }

    @PostMapping
    public ResponseEntity<ProductFieldConfigResponse> createField(
            @PathVariable Long serviceTypeId,
            @Valid @RequestBody ProductFieldConfigRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(serviceTypeId, request));
    }

    @PutMapping("/{fieldId}")
    public ResponseEntity<ProductFieldConfigResponse> updateField(
            @PathVariable Long serviceTypeId,
            @PathVariable Long fieldId,
            @Valid @RequestBody ProductFieldConfigRequest request) {
        return ResponseEntity.ok(service.update(serviceTypeId, fieldId, request));
    }

    @DeleteMapping("/{fieldId}")
    public ResponseEntity<Void> deleteField(
            @PathVariable Long serviceTypeId,
            @PathVariable Long fieldId) {
        service.delete(serviceTypeId, fieldId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderFields(
            @PathVariable Long serviceTypeId,
            @RequestBody List<Long> orderedIds) {
        service.reorder(serviceTypeId, orderedIds);
        return ResponseEntity.noContent().build();
    }
}
