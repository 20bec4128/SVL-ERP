package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.VendorRequest;
import com.nexorcrm.backend.dto.VendorResponse;
import com.nexorcrm.backend.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {

    private final VendorService service;

    public VendorController(VendorService service) {
        this.service = service;
    }

    @GetMapping
    public List<VendorResponse> list() {
        return service.listVendors();
    }

    @PostMapping
    public VendorResponse create(@Valid @RequestBody VendorRequest req) {
        return service.createVendor(req);
    }

    @PutMapping("/{id}")
    public VendorResponse update(@PathVariable Long id, @Valid @RequestBody VendorRequest req) {
        return service.updateVendor(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteVendor(id);
    }
}
