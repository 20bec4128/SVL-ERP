package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ServiceCategoryRequest;
import com.nexorcrm.backend.dto.ServiceCategoryPageResponse;
import com.nexorcrm.backend.dto.ServiceCategoryResponse;
import com.nexorcrm.backend.service.ServiceCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-categories")
@CrossOrigin(origins = "http://localhost:3000")
public class ServiceCategoryController {

    private final ServiceCategoryService service;

    public ServiceCategoryController(ServiceCategoryService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        if (page == null && size == null) {
            return ResponseEntity.ok(service.list());
        }
        ServiceCategoryPageResponse response = service.listPaged(page, size);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ServiceCategoryResponse> create(@Valid @RequestBody ServiceCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceCategoryResponse> update(@PathVariable Long id, @Valid @RequestBody ServiceCategoryRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
