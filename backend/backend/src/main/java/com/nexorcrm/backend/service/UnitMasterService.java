package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.UnitMasterResponse;
import com.nexorcrm.backend.entity.UnitMaster;
import com.nexorcrm.backend.repo.UnitMasterRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class UnitMasterService {

    private final UnitMasterRepository repository;

    public UnitMasterService(UnitMasterRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<UnitMasterResponse> getAll() {
        return repository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(UnitMasterResponse::new)
                .toList();
    }

    @Transactional
    public UnitMasterResponse add(String name) {
        String normalized = normalizeName(name);
        if (!StringUtils.hasText(normalized)) {
            throw new IllegalArgumentException("Unit name is required");
        }

        UnitMaster existing = repository.findFirstByNameIgnoreCase(normalized).orElse(null);
        if (existing != null) {
            if (Boolean.TRUE.equals(existing.getIsActive())) {
                throw new IllegalArgumentException("Unit already exists");
            }

            existing.setIsActive(true);
            existing.setName(normalized);
            return new UnitMasterResponse(repository.save(existing));
        }

        UnitMaster u = new UnitMaster();
        u.setName(normalized);
        u.setIsActive(true);
        u = repository.save(u);
        return new UnitMasterResponse(u);
    }

    @Transactional
    public void delete(Long id) {
        UnitMaster u = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Unit not found"));
        u.setIsActive(false);
        repository.save(u);
    }

    private String normalizeName(String name) {
        return name == null ? "" : name.trim();
    }
}
