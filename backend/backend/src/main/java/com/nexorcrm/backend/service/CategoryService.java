package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.CategoryRequest;
import com.nexorcrm.backend.dto.CategoryResponse;
import com.nexorcrm.backend.entity.AccountingCategory;
import com.nexorcrm.backend.repo.AccountingCategoryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class CategoryService {

    private final AccountingCategoryRepository repository;

    public CategoryService(AccountingCategoryRepository repository) {
        this.repository = repository;
    }

    public List<CategoryResponse> list() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream()
                .map(CategoryResponse::new)
                .toList();
    }

    public CategoryResponse create(CategoryRequest request) {
        String name = normalize(request.getName());
        String subName = normalize(request.getSubName());
        validate(name, subName);

        if (repository.existsByNameIgnoreCaseAndSubNameIgnoreCaseAndDeletedFalse(name, subName)) {
            throw new IllegalArgumentException("Category already exists");
        }

        AccountingCategory category = new AccountingCategory();
        category.setName(name);
        category.setSubName(subName);
        return new CategoryResponse(repository.save(category));
    }

    public CategoryResponse update(Long id, CategoryRequest request) {
        AccountingCategory category = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        if (Boolean.TRUE.equals(category.getDeleted())) {
            throw new EntityNotFoundException("Category not found");
        }

        String name = normalize(request.getName());
        String subName = normalize(request.getSubName());
        validate(name, subName);

        if (repository.existsByNameIgnoreCaseAndSubNameIgnoreCaseAndDeletedFalseAndIdNot(name, subName, id)) {
            throw new IllegalArgumentException("Category already exists");
        }

        category.setName(name);
        category.setSubName(subName);
        return new CategoryResponse(repository.save(category));
    }

    public void delete(Long id) {
        AccountingCategory category = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        if (Boolean.TRUE.equals(category.getDeleted())) {
            return;
        }
        category.setDeleted(true);
        repository.save(category);
    }

    private void validate(String name, String subName) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Category name is required");
        }
        if (!StringUtils.hasText(subName)) {
            throw new IllegalArgumentException("Sub category name is required");
        }
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim();
    }
}
