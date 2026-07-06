package com.nexorcrm.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexorcrm.backend.dto.StockCategoryRequest;
import com.nexorcrm.backend.dto.StockCategoryResponse;
import com.nexorcrm.backend.dto.StockItemRequest;
import com.nexorcrm.backend.dto.StockItemResponse;
import com.nexorcrm.backend.entity.StockCategory;
import com.nexorcrm.backend.entity.StockItem;
import com.nexorcrm.backend.repo.StockCategoryRepository;
import com.nexorcrm.backend.repo.StockItemRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class StockService {
    private final StockCategoryRepository catRepo;
    private final StockItemRepository itemRepo;
    private final ObjectMapper objectMapper;

    public StockService(StockCategoryRepository catRepo, StockItemRepository itemRepo, ObjectMapper objectMapper) {
        this.catRepo = catRepo;
        this.itemRepo = itemRepo;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<StockCategoryResponse> listCategories() {
        return catRepo.findByDeletedFalseOrderByIdDesc().stream().map(this::toCatResponse).toList();
    }

    public StockCategoryResponse createCategory(StockCategoryRequest req) {
        String name = normalizeName(req.getName());
        if (catRepo.existsByNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalArgumentException("Category already exists");
        }
        StockCategory c = new StockCategory();
        c.setName(name);
        c.setFields(req.getFields());
        try {
            c.setAllowedVendorTypeIds(objectMapper.writeValueAsString(req.getAllowedVendorTypeIds()));
        } catch (Exception e) {
            c.setAllowedVendorTypeIds(null);
        }
        c = catRepo.save(c);
        return toCatResponse(c);
    }

    public StockCategoryResponse updateCategory(Long id, StockCategoryRequest req) {
        StockCategory c = catRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Category not found"));
        if (c.isDeleted()) throw new EntityNotFoundException("Category not found");
        c.setName(normalizeName(req.getName()));
        c.setFields(req.getFields());
        try {
            c.setAllowedVendorTypeIds(objectMapper.writeValueAsString(req.getAllowedVendorTypeIds()));
        } catch (Exception e) {
            // ignore
        }
        c = catRepo.save(c);
        return toCatResponse(c);
    }

    public void deleteCategory(Long id) {
        StockCategory c = catRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Category not found"));
        c.setDeleted(true);
        catRepo.save(c);
    }

    @Transactional(readOnly = true)
    public List<StockItemResponse> listItems() {
        return itemRepo.findByDeletedFalseOrderByIdDesc().stream().map(this::toItemResponse).toList();
    }

    public StockItemResponse createItem(StockItemRequest req) {
        StockItem i = new StockItem();
        i.setCategoryId(req.getCategoryId());
        i.setName(req.getName());
        i.setQuantity(req.getQuantity());
        i.setMinThreshold(req.getMinThreshold());
        i.setValues(req.getValues());
        i.setVendorId(req.getVendorId());
        i.setVendorName(req.getVendorName());
        i.setBrandId(req.getBrandId());
        i.setBrandName(req.getBrandName());
        i = itemRepo.save(i);
        return toItemResponse(i);
    }

    public StockItemResponse updateItem(Long id, StockItemRequest req) {
        StockItem i = itemRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Item not found"));
        if (i.isDeleted()) throw new EntityNotFoundException("Item not found");
        i.setCategoryId(req.getCategoryId());
        i.setName(req.getName());
        i.setQuantity(req.getQuantity());
        i.setMinThreshold(req.getMinThreshold());
        i.setValues(req.getValues());
        i.setVendorId(req.getVendorId());
        i.setVendorName(req.getVendorName());
        i.setBrandId(req.getBrandId());
        i.setBrandName(req.getBrandName());
        i = itemRepo.save(i);
        return toItemResponse(i);
    }

    public void deleteItem(Long id) {
        StockItem i = itemRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Item not found"));
        i.setDeleted(true);
        itemRepo.save(i);
    }

    private String normalizeName(String name) {
        if (!StringUtils.hasText(name)) return "";
        return name.trim();
    }

    private StockCategoryResponse toCatResponse(StockCategory c) {
        StockCategoryResponse r = new StockCategoryResponse();
        r.setId(c.getId());
        r.setName(c.getName());
        r.setFields(c.getFields());
        try {
            if (c.getAllowedVendorTypeIds() != null) {
                java.util.List<Long> list = objectMapper.readValue(
                        c.getAllowedVendorTypeIds(), new TypeReference<List<Long>>(){});
                r.setAllowedVendorTypeIds(list);
            }
        } catch (Exception e) {
            r.setAllowedVendorTypeIds(Collections.emptyList());
        }
        return r;
    }

    private StockItemResponse toItemResponse(StockItem i) {
        StockItemResponse r = new StockItemResponse();
        r.setId(i.getId());
        r.setCategoryId(i.getCategoryId());
        r.setName(i.getName());
        r.setQuantity(i.getQuantity());
        r.setMinThreshold(i.getMinThreshold());
        r.setValues(i.getValues());
        r.setVendorId(i.getVendorId());
        r.setVendorName(i.getVendorName());
        r.setBrandId(i.getBrandId());
        r.setBrandName(i.getBrandName());
        r.setCategoryName(resolveCategoryName(i.getCategoryId()));
        return r;
    }

    private String resolveCategoryName(Long categoryId) {
        if (categoryId == null) return null;
        return catRepo.findById(categoryId).map(StockCategory::getName).orElse(null);
    }
}
