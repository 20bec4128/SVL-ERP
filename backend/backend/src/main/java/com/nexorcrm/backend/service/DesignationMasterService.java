package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.DesignationMasterRequest;
import com.nexorcrm.backend.dto.DesignationMasterResponse;
import com.nexorcrm.backend.entity.DesignationMaster;
import com.nexorcrm.backend.repo.DesignationMasterRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class DesignationMasterService {

    private final DesignationMasterRepository repository;
    private final com.nexorcrm.backend.repo.DepartmentMasterRepository departmentMasterRepository;

    public DesignationMasterService(DesignationMasterRepository repository, com.nexorcrm.backend.repo.DepartmentMasterRepository departmentMasterRepository) {
        this.repository = repository;
        this.departmentMasterRepository = departmentMasterRepository;
    }

    public List<DesignationMasterResponse> list(Long departmentMasterId) {
        var items = departmentMasterId == null
                ? repository.findByDeletedFalseOrderByIdDesc()
                : repository.findByDepartmentsIdAndDeletedFalseOrderByIdDesc(departmentMasterId);
        return items
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional
    public DesignationMasterResponse create(DesignationMasterRequest request) {
        String name = normalize(request.getName());
        if (repository.existsByNameIgnoreCaseAndDeletedFalse(name)) {
            throw new IllegalArgumentException("Designation already exists");
        }

        DesignationMaster d = new DesignationMaster();
        d.setName(name);
        d.setDepartment(""); // Legacy column
        d.setStatus(normalizeStatus(request.getStatus()));
        
        if (request.getDepartmentMasterIds() != null && !request.getDepartmentMasterIds().isEmpty()) {
            var depts = departmentMasterRepository.findAllById(request.getDepartmentMasterIds());
            d.getDepartments().addAll(depts);
        }

        d = repository.save(d);
        return toResponse(d);
    }

    @org.springframework.transaction.annotation.Transactional
    public DesignationMasterResponse update(Long id, DesignationMasterRequest request) {
        DesignationMaster d = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Designation not found"));

        if (Boolean.TRUE.equals(d.getDeleted())) {
            throw new EntityNotFoundException("Designation not found");
        }

        String nextName = normalize(request.getName());
        if (!nextName.equalsIgnoreCase(d.getName())
                && repository.existsByNameIgnoreCaseAndDeletedFalse(nextName)) {
            throw new IllegalArgumentException("Designation already exists");
        }

        d.setName(nextName);
        d.setStatus(normalizeStatus(request.getStatus()));
        
        d.getDepartments().clear();
        if (request.getDepartmentMasterIds() != null && !request.getDepartmentMasterIds().isEmpty()) {
            var depts = departmentMasterRepository.findAllById(request.getDepartmentMasterIds());
            d.getDepartments().addAll(depts);
        }

        d = repository.save(d);
        return toResponse(d);
    }

    public void delete(Long id) {
        DesignationMaster d = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Designation not found"));
        d.setDeleted(true);
        repository.save(d);
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) return "";
        return value.trim();
    }

    private String normalizeStatus(String status) {
        String s = (status == null ? "ACTIVE" : status).trim().toUpperCase();
        return "INACTIVE".equals(s) ? "INACTIVE" : "ACTIVE";
    }

    private DesignationMasterResponse toResponse(DesignationMaster d) {
        DesignationMasterResponse r = new DesignationMasterResponse();
        r.setId(d.getId());
        r.setName(d.getName());
        r.setStatus(d.getStatus());
        r.setEmployeeCount(0L);
        
        if (d.getDepartments() != null) {
            r.setDepartmentMasterIds(d.getDepartments().stream().map(com.nexorcrm.backend.entity.DepartmentMaster::getId).collect(java.util.stream.Collectors.toList()));
            r.setDepartmentMasterNames(d.getDepartments().stream().map(com.nexorcrm.backend.entity.DepartmentMaster::getName).collect(java.util.stream.Collectors.toList()));
        } else {
            r.setDepartmentMasterIds(java.util.List.of());
            r.setDepartmentMasterNames(java.util.List.of());
        }
        return r;
    }
}
