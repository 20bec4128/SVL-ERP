package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.DimensionMasterResponse;
import com.nexorcrm.backend.entity.DimensionMaster;
import com.nexorcrm.backend.repo.DimensionMasterRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class DimensionMasterService {

    private final DimensionMasterRepository repository;

    public DimensionMasterService(DimensionMasterRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<DimensionMasterResponse> getAll() {
        return repository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(DimensionMasterResponse::new)
                .toList();
    }

    @Transactional
    public DimensionMasterResponse add(String name) {
        String normalized = normalizeName(name);
        if (!StringUtils.hasText(normalized)) {
            throw new IllegalArgumentException("Dimension name is required");
        }

        DimensionMaster existing = repository.findFirstByNameIgnoreCase(normalized).orElse(null);
        if (existing != null) {
            if (Boolean.TRUE.equals(existing.getIsActive())) {
                throw new IllegalArgumentException("Dimension already exists");
            }

            existing.setIsActive(true);
            existing.setName(normalized);
            return new DimensionMasterResponse(repository.save(existing));
        }

        DimensionMaster d = new DimensionMaster();
        d.setName(normalized);
        d.setIsActive(true);
        d = repository.save(d);
        return new DimensionMasterResponse(d);
    }

    @Transactional
    public void delete(Long id) {
        DimensionMaster d = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dimension not found"));
        d.setIsActive(false);
        repository.save(d);
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.trim();
    }
}
