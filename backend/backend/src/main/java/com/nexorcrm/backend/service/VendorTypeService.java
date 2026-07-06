package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.VendorTypeRequest;
import com.nexorcrm.backend.dto.VendorTypeResponse;
import com.nexorcrm.backend.entity.VendorType;
import com.nexorcrm.backend.repo.VendorTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class VendorTypeService {

    private final VendorTypeRepository repo;

    public VendorTypeService(VendorTypeRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<VendorTypeResponse> listTypes() {
        return repo.findByDeletedFalseOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public VendorTypeResponse createType(VendorTypeRequest req) {
        VendorType t = new VendorType();
        t.setTypeName(normalizeTypeName(req.getTypeName()));
        t = repo.save(t);
        return toResponse(t);
    }

    @Transactional
    public VendorTypeResponse updateType(Long id, VendorTypeRequest req) {
        VendorType t = repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Vendor type not found"));
        if (t.isDeleted()) throw new EntityNotFoundException("Vendor type not found");
        t.setTypeName(normalizeTypeName(req.getTypeName()));
        t = repo.save(t);
        return toResponse(t);
    }

    @Transactional
    public void deleteType(Long id) {
        VendorType t = repo.findById(id).orElseThrow(() -> new EntityNotFoundException("Vendor type not found"));
        t.setDeleted(true);
        repo.save(t);
    }

    private VendorTypeResponse toResponse(VendorType t) {
        VendorTypeResponse r = new VendorTypeResponse();
        r.setId(t.getId());
        r.setTypeName(t.getTypeName());
        return r;
    }

    private String normalizeTypeName(String typeName) {
        if (!StringUtils.hasText(typeName)) {
            throw new IllegalArgumentException("Type name is required");
        }
        return typeName.trim();
    }
}
