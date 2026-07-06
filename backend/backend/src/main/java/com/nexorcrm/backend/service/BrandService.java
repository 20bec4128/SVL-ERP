package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.BrandRequest;
import com.nexorcrm.backend.dto.BrandResponse;
import com.nexorcrm.backend.entity.Brand;
import com.nexorcrm.backend.repo.BrandRepository;
import com.nexorcrm.backend.repo.StockCategoryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BrandService {

    private final BrandRepository repo;
    private final StockCategoryRepository catRepo;

    public BrandService(BrandRepository repo, StockCategoryRepository catRepo) {
        this.repo = repo;
        this.catRepo = catRepo;
    }

    @Transactional(readOnly = true)
    public List<BrandResponse> listBrands() {
        return repo.findByDeletedFalseOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public BrandResponse createBrand(BrandRequest req) {
        if (!catRepo.existsByIdAndDeletedFalse(req.getStockCategoryId())) {
            throw new IllegalArgumentException("Stock category not found");
        }
        Brand b = new Brand();
        b.setStockCategoryId(req.getStockCategoryId());
        b.setBrandName(req.getBrandName().trim());
        b = repo.save(b);
        return toResponse(b);
    }

    @Transactional
    public BrandResponse updateBrand(Long id, BrandRequest req) {
        Brand b = repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Brand not found"));
        if (b.isDeleted()) throw new EntityNotFoundException("Brand not found");
        if (!catRepo.existsByIdAndDeletedFalse(req.getStockCategoryId())) {
            throw new IllegalArgumentException("Stock category not found");
        }
        b.setStockCategoryId(req.getStockCategoryId());
        b.setBrandName(req.getBrandName().trim());
        b = repo.save(b);
        return toResponse(b);
    }

    @Transactional
    public void deleteBrand(Long id) {
        Brand b = repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Brand not found"));
        b.setDeleted(true);
        repo.save(b);
    }

    private BrandResponse toResponse(Brand b) {
        BrandResponse r = new BrandResponse();
        r.setId(b.getId());
        r.setStockCategoryId(b.getStockCategoryId());
        r.setBrandName(b.getBrandName());
        r.setCategoryName(resolveCategoryName(b.getStockCategoryId()));
        return r;
    }

    private String resolveCategoryName(Long categoryId) {
        if (categoryId == null) return null;
        return catRepo.findById(categoryId).map(c -> c.getName()).orElse(null);
    }
}
