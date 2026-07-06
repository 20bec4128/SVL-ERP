package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.HeadOfficeMasterRequest;
import com.nexorcrm.backend.dto.HeadOfficeMasterResponse;
import com.nexorcrm.backend.entity.HeadOfficeMaster;
import com.nexorcrm.backend.repo.HeadOfficeMasterRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class HeadOfficeMasterService {

    private final HeadOfficeMasterRepository repository;

    public HeadOfficeMasterService(HeadOfficeMasterRepository repository) {
        this.repository = repository;
    }

    public List<HeadOfficeMasterResponse> list() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public HeadOfficeMasterResponse create(HeadOfficeMasterRequest request) {
        String name = normalizeName(request.getName());
        if (repository.existsByNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalArgumentException("Head office already exists");
        }
        HeadOfficeMaster ho = new HeadOfficeMaster();
        ho.setName(name);
        ho.setLocation(normalizeLocation(request.getLocation()));
        ho.setStatus(normalizeStatus(request.getStatus()));
        ho = repository.save(ho);
        return toResponse(ho);
    }

    public HeadOfficeMasterResponse update(Long id, HeadOfficeMasterRequest request) {
        HeadOfficeMaster ho = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Head office not found"));
        if (Boolean.TRUE.equals(ho.getDeleted())) {
            throw new EntityNotFoundException("Head office not found");
        }
        ho.setName(normalizeName(request.getName()));
        ho.setLocation(normalizeLocation(request.getLocation()));
        ho.setStatus(normalizeStatus(request.getStatus()));
        ho = repository.save(ho);
        return toResponse(ho);
    }

    public void delete(Long id) {
        HeadOfficeMaster ho = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Head office not found"));
        ho.setDeleted(true);
        repository.save(ho);
    }

    private String normalizeName(String name) {
        if (!StringUtils.hasText(name)) return "";
        return name.trim();
    }

    private String normalizeLocation(String location) {
        if (!StringUtils.hasText(location)) return "";
        return location.trim();
    }

    private String normalizeStatus(String status) {
        String s = (status == null ? "ACTIVE" : status).trim().toUpperCase();
        return "INACTIVE".equals(s) ? "INACTIVE" : "ACTIVE";
    }

    private HeadOfficeMasterResponse toResponse(HeadOfficeMaster ho) {
        HeadOfficeMasterResponse r = new HeadOfficeMasterResponse();
        r.setId(ho.getId());
        r.setName(ho.getName());
        r.setLocation(ho.getLocation());
        r.setStatus(ho.getStatus());
        return r;
    }
}
