package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.ProductFieldConfigRequest;
import com.nexorcrm.backend.entity.DimensionMaster;
import com.nexorcrm.backend.dto.ProductFieldConfigResponse;
import com.nexorcrm.backend.entity.ProductFieldConfig;
import com.nexorcrm.backend.entity.ServiceType;
import com.nexorcrm.backend.repo.DimensionMasterRepository;
import com.nexorcrm.backend.repo.ProductFieldConfigRepository;
import com.nexorcrm.backend.repo.ServiceTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class ProductFieldConfigService {

    private final ProductFieldConfigRepository configRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final DimensionMasterRepository dimensionMasterRepository;

    public ProductFieldConfigService(
            ProductFieldConfigRepository configRepository,
            ServiceTypeRepository serviceTypeRepository,
            DimensionMasterRepository dimensionMasterRepository
    ) {
        this.configRepository = configRepository;
        this.serviceTypeRepository = serviceTypeRepository;
        this.dimensionMasterRepository = dimensionMasterRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductFieldConfigResponse> getByServiceType(Long serviceTypeId) {
        if (!serviceTypeRepository.existsById(serviceTypeId)) {
            throw new EntityNotFoundException("ServiceType not found with id: " + serviceTypeId);
        }
        return configRepository.findByServiceTypeIdAndIsActiveTrueOrderByDisplayOrderAsc(serviceTypeId)
                .stream()
                .map(ProductFieldConfigResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductFieldConfigResponse create(Long serviceTypeId, ProductFieldConfigRequest request) {
        ServiceType serviceType = serviceTypeRepository.findById(serviceTypeId)
                .orElseThrow(() -> new EntityNotFoundException("ServiceType not found with id: " + serviceTypeId));

        if (request.getFieldKey() == null || request.getFieldKey().trim().isEmpty()) {
            throw new IllegalArgumentException("Field key is required for creation");
        }

        int nextOrder = configRepository.findMaxDisplayOrderByServiceTypeId(serviceTypeId).orElse(0) + 1;

        ProductFieldConfig config = new ProductFieldConfig();
        config.setServiceType(serviceType);
        config.setFieldKey(request.getFieldKey());
        
        mapRequestToEntity(request, config);
        
        config.setDisplayOrder(nextOrder);
        config.setIsActive(true);
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());

        ProductFieldConfig saved = configRepository.save(config);
        return new ProductFieldConfigResponse(saved);
    }

    @Transactional
    public ProductFieldConfigResponse update(Long serviceTypeId, Long fieldId, ProductFieldConfigRequest request) {
        if (!serviceTypeRepository.existsById(serviceTypeId)) {
            throw new EntityNotFoundException("ServiceType not found with id: " + serviceTypeId);
        }

        ProductFieldConfig config = configRepository.findByIdAndServiceTypeIdAndIsActiveTrue(fieldId, serviceTypeId)
                .orElseThrow(() -> new EntityNotFoundException("Field configuration not found or does not belong to this ServiceType"));

        // Note: field_key remains untouched based on business rule 'locked after creation'
        mapRequestToEntity(request, config);
        config.setUpdatedAt(LocalDateTime.now());

        ProductFieldConfig saved = configRepository.save(config);
        return new ProductFieldConfigResponse(saved);
    }

    @Transactional
    public void delete(Long serviceTypeId, Long fieldId) {
        if (!serviceTypeRepository.existsById(serviceTypeId)) {
            throw new EntityNotFoundException("ServiceType not found with id: " + serviceTypeId);
        }

        ProductFieldConfig config = configRepository.findByIdAndServiceTypeIdAndIsActiveTrue(fieldId, serviceTypeId)
                .orElseThrow(() -> new EntityNotFoundException("Field configuration not found or does not belong to this ServiceType"));

        config.setIsActive(false);
        config.setUpdatedAt(LocalDateTime.now());
        configRepository.save(config);
    }

    @Transactional
    public void reorder(Long serviceTypeId, List<Long> orderedIds) {
        if (!serviceTypeRepository.existsById(serviceTypeId)) {
            throw new EntityNotFoundException("ServiceType not found with id: " + serviceTypeId);
        }

        List<ProductFieldConfig> configs = configRepository.findByServiceTypeIdAndIsActiveTrueOrderByDisplayOrderAsc(serviceTypeId);
        
        for (int i = 0; i < orderedIds.size(); i++) {
            final int order = i + 1; // capture as effectively final for lambda
            Long currentId = orderedIds.get(i);
            configs.stream()
                .filter(c -> c.getId().equals(currentId))
                .findFirst()
                .ifPresent(c -> {
                    c.setDisplayOrder(order);
                    c.setUpdatedAt(LocalDateTime.now());
                });
        }
        
        configRepository.saveAll(configs);
    }

    private void mapRequestToEntity(ProductFieldConfigRequest request, ProductFieldConfig config) {
        config.setLabel(request.getLabel());
        config.setFieldType(request.getFieldType());
        config.setOptions(request.getOptions());
        config.setIsRequired(request.getIsRequired() != null ? request.getIsRequired() : false);
        config.setPlaceholder(request.getPlaceholder());
        config.setAllowCustom(request.getAllowCustom() != null ? request.getAllowCustom() : false);
        config.setIsHidden(request.getIsHidden() != null ? request.getIsHidden() : false);
        config.setHasUnit(request.getHasUnit() != null ? request.getHasUnit() : false);
        config.setUnitOptions(request.getUnitOptions());
        config.setDefaultUnit(request.getDefaultUnit());
        config.setEnable3rdDimension(request.getEnable3rdDimension() != null ? request.getEnable3rdDimension() : false);
        config.setThirdDimensionLabel(request.getThirdDimensionLabel());
        if (isSizeField(config)) {
            String customSizeMode = normalizeText(request.getCustomSizeMode());
            List<String> customDimensions = "text".equalsIgnoreCase(customSizeMode)
                    ? null
                    : sanitizeCustomDimensions(request.getCustomDimensions());
            config.setCustomDimensions(customDimensions);
            config.setCustomDimensionUnit(customDimensions == null || customDimensions.isEmpty()
                    ? null
                    : normalizeText(request.getCustomDimensionUnit()));
            config.setCustomSizeMode(customSizeMode);
        } else {
            config.setCustomDimensions(null);
            config.setCustomDimensionUnit(null);
            config.setCustomSizeMode(null);
        }
        config.setDependsOn(request.getDependsOn());
        config.setDependsOnValue(request.getDependsOnValue());
    }

    private boolean isSizeField(ProductFieldConfig config) {
        return config.getFieldKey() != null && "size".equalsIgnoreCase(config.getFieldKey());
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> sanitizeCustomDimensions(List<String> requestedDimensions) {
        if (requestedDimensions == null) {
            return null;
        }

        Map<String, String> activeDimensionsByName = loadActiveDimensionsByName();
        LinkedHashSet<String> sanitized = new LinkedHashSet<>();
        for (String dimension : requestedDimensions) {
            String normalized = normalizeDimensionLabel(dimension, activeDimensionsByName);
            if (normalized != null) {
                sanitized.add(normalized);
            }
        }

        if (sanitized.isEmpty()) {
            return null;
        }

        return new ArrayList<>(sanitized);
    }

    private Map<String, String> loadActiveDimensionsByName() {
        Map<String, String> dimensionsByName = new HashMap<>();
        for (DimensionMaster dimensionMaster : dimensionMasterRepository.findByIsActiveTrueOrderByNameAsc()) {
            String name = normalizeText(dimensionMaster.getName());
            if (name != null) {
                dimensionsByName.put(name.toLowerCase(Locale.ROOT), name);
            }
        }
        return dimensionsByName;
    }

    private String normalizeDimensionLabel(String value, Map<String, String> activeDimensionsByName) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }

        String canonical = activeDimensionsByName.get(normalized.toLowerCase(Locale.ROOT));
        if (canonical != null) {
            return canonical;
        }

        throw new IllegalArgumentException("Invalid custom dimension: " + normalized);
    }
}
