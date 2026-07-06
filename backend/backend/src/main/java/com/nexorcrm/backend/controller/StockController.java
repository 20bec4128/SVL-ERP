package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.StockCategoryRequest;
import com.nexorcrm.backend.dto.StockCategoryResponse;
import com.nexorcrm.backend.dto.StockItemRequest;
import com.nexorcrm.backend.dto.StockItemResponse;
import com.nexorcrm.backend.service.StockService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
public class StockController {

    private final StockService service;

    public StockController(StockService service) {
        this.service = service;
    }

    // categories
    @GetMapping("/categories")
    public List<StockCategoryResponse> getCategories() {
        return service.listCategories();
    }

    @PostMapping("/categories")
    public StockCategoryResponse createCategory(@Valid @RequestBody StockCategoryRequest req) {
        return service.createCategory(req);
    }

    @PutMapping("/categories/{id}")
    public StockCategoryResponse updateCategory(@PathVariable Long id,
                                                @Valid @RequestBody StockCategoryRequest req) {
        return service.updateCategory(id, req);
    }

    @DeleteMapping("/categories/{id}")
    public void deleteCategory(@PathVariable Long id) {
        service.deleteCategory(id);
    }

    // items
    @GetMapping("/items")
    public List<StockItemResponse> getItems() {
        return service.listItems();
    }

    @PostMapping("/items")
    public StockItemResponse createItem(@Valid @RequestBody StockItemRequest req) {
        return service.createItem(req);
    }

    @PutMapping("/items/{id}")
    public StockItemResponse updateItem(@PathVariable Long id,
                                        @Valid @RequestBody StockItemRequest req) {
        return service.updateItem(id, req);
    }

    @DeleteMapping("/items/{id}")
    public void deleteItem(@PathVariable Long id) {
        service.deleteItem(id);
    }
}
