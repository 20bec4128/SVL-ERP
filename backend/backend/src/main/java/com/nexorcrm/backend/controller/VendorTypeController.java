package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.VendorTypeRequest;
import com.nexorcrm.backend.dto.VendorTypeResponse;
import com.nexorcrm.backend.service.VendorTypeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor-types")
public class VendorTypeController {

    private final VendorTypeService service;

    public VendorTypeController(VendorTypeService service) {
        this.service = service;
    }

    @GetMapping
    public List<VendorTypeResponse> list() {
        return service.listTypes();
    }

    @PostMapping
    public VendorTypeResponse create(@Valid @RequestBody VendorTypeRequest req) {
        return service.createType(req);
    }

    @PutMapping("/{id}")
    public VendorTypeResponse update(@PathVariable Long id, @Valid @RequestBody VendorTypeRequest req) {
        return service.updateType(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteType(id);
    }
}
