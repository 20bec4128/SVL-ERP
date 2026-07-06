package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.ServiceTypeRequest;
import com.nexorcrm.backend.dto.ServiceTypePageResponse;
import com.nexorcrm.backend.dto.ServiceTypeResponse;
import com.nexorcrm.backend.service.ServiceTypeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/service-types")
@CrossOrigin(origins = "http://localhost:3000")
public class ServiceTypeController {

    private final ServiceTypeService service;

    public ServiceTypeController(ServiceTypeService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Long categoryId
    ) {
        if (page == null && size == null && categoryId == null) {
            return ResponseEntity.ok(service.list());
        }
        ServiceTypePageResponse response = service.listPaged(page, size, categoryId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ServiceTypeResponse> create(@Valid @RequestBody ServiceTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceTypeResponse> update(@PathVariable Long id, @Valid @RequestBody ServiceTypeRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
