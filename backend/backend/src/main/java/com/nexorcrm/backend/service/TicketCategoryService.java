package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.TicketCategoryRequest;
import com.nexorcrm.backend.dto.TicketCategoryResponse;
import com.nexorcrm.backend.entity.TicketCategory;
import com.nexorcrm.backend.repo.TicketCategoryRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class TicketCategoryService {

    private final TicketCategoryRepository repository;

    public TicketCategoryService(TicketCategoryRepository repository) {
        this.repository = repository;
    }

    public List<TicketCategoryResponse> list() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TicketCategoryResponse create(TicketCategoryRequest request) {
        String name = normalize(request.getName());
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Category name is required");
        }
        if (repository.existsByNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalArgumentException("Category already exists");
        }

        TicketCategory c = new TicketCategory();
        c.setName(name);
        return toResponse(repository.save(c));
    }

    public TicketCategoryResponse update(Long id, TicketCategoryRequest request) {
        TicketCategory c = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        if (Boolean.TRUE.equals(c.getDeleted())) {
            throw new EntityNotFoundException("Category not found");
        }

        String name = normalize(request.getName());
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Category name is required");
        }
        c.setName(name);
        return toResponse(repository.save(c));
    }

    public void delete(Long id) {
        TicketCategory c = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found"));
        c.setDeleted(true);
        repository.save(c);
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) return "";
        return value.trim();
    }

    private TicketCategoryResponse toResponse(TicketCategory c) {
        TicketCategoryResponse r = new TicketCategoryResponse();
        r.setId(c.getId());
        r.setName(c.getName());
        r.setCreatedAt(c.getCreatedAt());
        return r;
    }
}
