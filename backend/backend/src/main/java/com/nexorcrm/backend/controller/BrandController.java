package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.BrandRequest;
import com.nexorcrm.backend.dto.BrandResponse;
import com.nexorcrm.backend.service.BrandService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/brands")
public class BrandController {

    private final BrandService service;

    public BrandController(BrandService service) {
        this.service = service;
    }

    @GetMapping
    public List<BrandResponse> list() {
        return service.listBrands();
    }

    @PostMapping
    public BrandResponse create(@Valid @RequestBody BrandRequest req) {
        return service.createBrand(req);
    }

    @PutMapping("/{id}")
    public BrandResponse update(@PathVariable Long id, @Valid @RequestBody BrandRequest req) {
        return service.updateBrand(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteBrand(id);
    }
}
