package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.BranchMasterRequest;
import com.nexorcrm.backend.dto.BranchMasterResponse;
import com.nexorcrm.backend.entity.BranchMaster;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.HeadOfficeMasterRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class BranchMasterService {

    private final BranchMasterRepository repository;
    private final HeadOfficeMasterRepository headOfficeRepository;

    public BranchMasterService(BranchMasterRepository repository, HeadOfficeMasterRepository headOfficeRepository) {
        this.repository = repository;
        this.headOfficeRepository = headOfficeRepository;
    }

    public List<BranchMasterResponse> list(Long headOfficeId) {
        List<BranchMaster> items = headOfficeId == null
                ? repository.findByDeletedFalseOrderByIdDesc()
                : repository.findByHeadOfficeIdAndDeletedFalseOrderByIdDesc(headOfficeId);
        return items.stream().map(this::toResponse).toList();
    }

    public BranchMasterResponse create(BranchMasterRequest request) {
        Long headOfficeId = request.getHeadOfficeId();
        assertHeadOfficeExists(headOfficeId);
        String name = normalizeName(request.getName());
        if (repository.existsByHeadOfficeIdAndNameIgnoreCaseAndDeletedFalse(headOfficeId, name)) {
            throw new IllegalArgumentException("Branch already exists for this head office");
        }

        BranchMaster b = new BranchMaster();
        b.setHeadOfficeId(headOfficeId);
        b.setName(name);
        b.setLocation(normalizeLocation(request.getLocation()));
        b.setStatus(normalizeStatus(request.getStatus()));
        b = repository.save(b);
        return toResponse(b);
    }

    public BranchMasterResponse update(Long id, BranchMasterRequest request) {
        BranchMaster b = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
        if (Boolean.TRUE.equals(b.getDeleted())) {
            throw new EntityNotFoundException("Branch not found");
        }

        Long headOfficeId = request.getHeadOfficeId();
        assertHeadOfficeExists(headOfficeId);
        String name = normalizeName(request.getName());
        if (!headOfficeId.equals(b.getHeadOfficeId())
                || !name.equalsIgnoreCase(b.getName())) {
            if (repository.existsByHeadOfficeIdAndNameIgnoreCaseAndDeletedFalse(headOfficeId, name)) {
                throw new IllegalArgumentException("Branch already exists for this head office");
            }
        }

        b.setHeadOfficeId(headOfficeId);
        b.setName(name);
        b.setLocation(normalizeLocation(request.getLocation()));
        b.setStatus(normalizeStatus(request.getStatus()));
        b = repository.save(b);
        return toResponse(b);
    }

    public void delete(Long id) {
        BranchMaster b = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
        b.setDeleted(true);
        repository.save(b);
    }

    private void assertHeadOfficeExists(Long headOfficeId) {
        if (headOfficeId == null || headOfficeRepository.findById(headOfficeId).isEmpty()) {
            throw new EntityNotFoundException("Head office not found");
        }
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

    private BranchMasterResponse toResponse(BranchMaster b) {
        BranchMasterResponse r = new BranchMasterResponse();
        r.setId(b.getId());
        r.setHeadOfficeId(b.getHeadOfficeId());
        r.setName(b.getName());
        r.setLocation(b.getLocation());
        r.setStatus(b.getStatus());
        return r;
    }
}
