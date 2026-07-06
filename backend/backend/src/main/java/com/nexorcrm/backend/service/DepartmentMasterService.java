package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.DepartmentMasterRequest;
import com.nexorcrm.backend.dto.DepartmentMasterResponse;
import com.nexorcrm.backend.entity.DepartmentMaster;
import com.nexorcrm.backend.repo.DepartmentMasterRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class DepartmentMasterService {

    private final DepartmentMasterRepository repository;
    private final com.nexorcrm.backend.repo.BranchMasterRepository branchMasterRepository;

    public DepartmentMasterService(DepartmentMasterRepository repository, com.nexorcrm.backend.repo.BranchMasterRepository branchMasterRepository) {
        this.repository = repository;
        this.branchMasterRepository = branchMasterRepository;
    }

    public List<DepartmentMasterResponse> list(Long branchId) {
        var items = branchId == null
                ? repository.findByDeletedFalseOrderByIdDesc()
                : repository.findByBranchesIdAndDeletedFalseOrderByIdDesc(branchId);
        return items
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional
    public DepartmentMasterResponse create(DepartmentMasterRequest request) {
        String name = normalizeName(request.getName());
        if (repository.existsByNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalArgumentException("Department already exists");
        }

        DepartmentMaster d = new DepartmentMaster();
        d.setName(name);
        d.setStatus(normalizeStatus(request.getStatus()));
        
        if (request.getBranchIds() != null && !request.getBranchIds().isEmpty()) {
            var branches = branchMasterRepository.findAllById(request.getBranchIds());
            d.getBranches().addAll(branches);
        }

        d = repository.save(d);
        return toResponse(d);
    }

    @org.springframework.transaction.annotation.Transactional
    public DepartmentMasterResponse update(Long id, DepartmentMasterRequest request) {
        DepartmentMaster d = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));

        if (Boolean.TRUE.equals(d.getDeleted())) {
            throw new EntityNotFoundException("Department not found");
        }

        String nextName = normalizeName(request.getName());
        if (!nextName.equalsIgnoreCase(d.getName())
                && repository.existsByNameIgnoreCaseAndDeletedFalse(nextName)) {
            throw new IllegalArgumentException("Department already exists");
        }

        d.setName(nextName);
        d.setStatus(normalizeStatus(request.getStatus()));
        
        d.getBranches().clear();
        if (request.getBranchIds() != null && !request.getBranchIds().isEmpty()) {
            var branches = branchMasterRepository.findAllById(request.getBranchIds());
            d.getBranches().addAll(branches);
        }

        d = repository.save(d);
        return toResponse(d);
    }

    public void delete(Long id) {
        DepartmentMaster d = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));
        d.setDeleted(true);
        repository.save(d);
    }

    private String normalizeName(String name) {
        if (!StringUtils.hasText(name)) return "";
        return name.trim();
    }

    private String normalizeStatus(String status) {
        String s = (status == null ? "ACTIVE" : status).trim().toUpperCase();
        return "INACTIVE".equals(s) ? "INACTIVE" : "ACTIVE";
    }

    private DepartmentMasterResponse toResponse(DepartmentMaster d) {
        DepartmentMasterResponse r = new DepartmentMasterResponse();
        r.setId(d.getId());
        r.setName(d.getName());
        r.setStatus(d.getStatus());
        r.setEmployeeCount(0L); // keep for frontend compatibility
        
        if (d.getBranches() != null) {
            r.setBranchIds(d.getBranches().stream().map(com.nexorcrm.backend.entity.BranchMaster::getId).collect(java.util.stream.Collectors.toList()));
            r.setBranchNames(d.getBranches().stream().map(com.nexorcrm.backend.entity.BranchMaster::getName).collect(java.util.stream.Collectors.toList()));
        } else {
            r.setBranchIds(java.util.List.of());
            r.setBranchNames(java.util.List.of());
        }
        return r;
    }
}
