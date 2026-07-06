package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.ServiceTypeRequest;
import com.nexorcrm.backend.dto.ServiceTypePageResponse;
import com.nexorcrm.backend.dto.ServiceTypeResponse;
import com.nexorcrm.backend.dto.ServiceTypeTreeResponse;
import com.nexorcrm.backend.entity.ServiceType;
import com.nexorcrm.backend.entity.ServiceCategory;
import com.nexorcrm.backend.repo.ServiceTypeRepository;
import com.nexorcrm.backend.repo.ServiceCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServiceTypeService {

    private final ServiceTypeRepository repository;
    private final ServiceCategoryRepository categoryRepository;

    public ServiceTypeService(ServiceTypeRepository repository, ServiceCategoryRepository categoryRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
    }

    public List<ServiceTypeResponse> list() {
        return repository.findByDeletedFalse()
                .stream()
                .map(ServiceTypeResponse::new)
                .collect(Collectors.toList());
    }

    public ServiceTypePageResponse listPaged(Integer page, Integer size, Long categoryId) {
        int safePage = page == null ? 0 : Math.max(0, page);
        int safeSize = size == null ? 10 : Math.max(1, size);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "name").and(Sort.by(Sort.Direction.ASC, "id")));
        Page<ServiceType> parentPage = categoryId == null
                ? repository.findByDeletedFalseAndParentIsNull(pageable)
                : repository.findByDeletedFalseAndParentIsNullAndCategory_Id(categoryId, pageable);

        List<ServiceType> allParents = parentPage.getContent();

        List<Long> parentIds = allParents.stream().map(ServiceType::getId).collect(Collectors.toList());
        Map<Long, List<ServiceTypeTreeResponse>> childrenByParent = new HashMap<>();
        if (!parentIds.isEmpty()) {
            List<ServiceType> children = repository.findByDeletedFalseAndParentIdIn(parentIds);
            children.stream()
                    .sorted(Comparator.comparing(ServiceType::getName, String.CASE_INSENSITIVE_ORDER)
                            .thenComparing(ServiceType::getId, Comparator.nullsLast(Long::compareTo)))
                    .forEach(child -> {
                        Long parentId = child.getParent() != null ? child.getParent().getId() : null;
                        if (parentId == null) return;
                        childrenByParent.computeIfAbsent(parentId, key -> new ArrayList<>())
                                .add(new ServiceTypeTreeResponse(child));
                    });
        }

        List<ServiceTypeTreeResponse> content = allParents.stream()
                .map(parent -> {
                    ServiceTypeTreeResponse response = new ServiceTypeTreeResponse(parent);
                    response.setChildren(childrenByParent.getOrDefault(parent.getId(), List.of()));
                    return response;
                })
                .collect(Collectors.toList());

        return new ServiceTypePageResponse(
                content,
                parentPage.getNumber() + 1,
                parentPage.getSize(),
                parentPage.getTotalElements(),
                parentPage.getTotalPages()
        );
    }

    public ServiceTypeResponse create(ServiceTypeRequest request) {
        String normalizedFieldConfigKey = normalizeFieldConfigKey(request.getFieldConfigKey());
        ServiceCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Service Category not found with id: " + request.getCategoryId()));
        ServiceType parent = null;
        if (request.getParentId() != null) {
            parent = repository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent Service Type not found with id: " + request.getParentId()));
            if (!parent.getCategory().getId().equals(request.getCategoryId())) {
                throw new RuntimeException("Parent Service Type must belong to the same category");
            }
        }
        validateFieldConfigKeyForCreate(normalizedFieldConfigKey);

        ServiceType entity = new ServiceType();
        entity.setName(request.getName().trim());
        entity.setFieldConfigKey(normalizedFieldConfigKey);
        entity.setCategory(category);
        entity.setParent(parent);
        entity.setDeleted(false);
        entity.setUpdatedAt(LocalDateTime.now());

        ServiceType saved = repository.saveAndFlush(entity);
        return new ServiceTypeResponse(saved);
    }

    public ServiceTypeResponse update(Long id, ServiceTypeRequest request) {
        String normalizedFieldConfigKey = normalizeFieldConfigKey(request.getFieldConfigKey());
        ServiceType entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service Type not found with id: " + id));

        ServiceCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Service Category not found with id: " + request.getCategoryId()));
        ServiceType parent = null;
        if (request.getParentId() != null) {
            parent = repository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent Service Type not found with id: " + request.getParentId()));
            if (!parent.getCategory().getId().equals(request.getCategoryId())) {
                throw new RuntimeException("Parent Service Type must belong to the same category");
            }
        }
        validateFieldConfigKeyForUpdate(entity, normalizedFieldConfigKey);

        entity.setName(request.getName().trim());
        entity.setFieldConfigKey(normalizedFieldConfigKey);
        entity.setCategory(category);
        entity.setParent(parent);
        entity.setUpdatedAt(LocalDateTime.now());

        ServiceType updated = repository.saveAndFlush(entity);
        return new ServiceTypeResponse(updated);
    }

    public void delete(Long id) {
        ServiceType entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service Type not found with id: " + id));
        entity.setDeleted(true);
        entity.setUpdatedAt(LocalDateTime.now());
        repository.saveAndFlush(entity);
    }

    private String normalizeFieldConfigKey(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }

    private void validateFieldConfigKeyForCreate(String fieldConfigKey) {
        if (fieldConfigKey == null || fieldConfigKey.isBlank()) {
            throw new RuntimeException("Field config key is required");
        }
        if (repository.existsByFieldConfigKeyIgnoreCaseAndDeletedFalse(fieldConfigKey)) {
            throw new RuntimeException("Field config key already exists");
        }
    }

    private void validateFieldConfigKeyForUpdate(ServiceType entity, String fieldConfigKey) {
        if (fieldConfigKey == null || fieldConfigKey.isBlank()) {
            throw new RuntimeException("Field config key is required");
        }
        String existingKey = entity.getFieldConfigKey();
        if (existingKey != null && !existingKey.isBlank() && !existingKey.equalsIgnoreCase(fieldConfigKey)) {
            throw new RuntimeException("Field config key cannot be changed once set");
        }
        if (repository.existsByFieldConfigKeyIgnoreCaseAndDeletedFalseAndIdNot(fieldConfigKey, entity.getId())) {
            throw new RuntimeException("Field config key already exists");
        }
    }
}
