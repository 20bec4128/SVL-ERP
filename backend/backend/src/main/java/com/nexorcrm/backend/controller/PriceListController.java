package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.PriceListEntryRequest;
import com.nexorcrm.backend.dto.PriceListEntryResponse;
import com.nexorcrm.backend.dto.PriceListPageResponse;
import com.nexorcrm.backend.dto.PriceListSummaryResponse;
import com.nexorcrm.backend.service.PriceListService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/price-list")
public class PriceListController {

    private final PriceListService service;

    public PriceListController(PriceListService service) {
        this.service = service;
    }

    @GetMapping
    public PriceListPageResponse list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long typeId,
            @RequestParam(required = false) Long subtypeId
    ) {
        return service.listPaged(page, size, search, categoryId, typeId, subtypeId);
    }

    @GetMapping("/summary")
    public PriceListSummaryResponse summary(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long typeId
    ) {
        return service.summary(categoryId, typeId);
    }

    @GetMapping("/{id}")
    public PriceListEntryResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    public PriceListEntryResponse create(@Valid @RequestBody PriceListEntryRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public PriceListEntryResponse update(@PathVariable Long id, @Valid @RequestBody PriceListEntryRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
