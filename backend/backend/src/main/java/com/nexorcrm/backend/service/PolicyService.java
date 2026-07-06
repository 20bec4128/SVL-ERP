package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.PolicyRequest;
import com.nexorcrm.backend.dto.PolicyResponse;
import com.nexorcrm.backend.entity.DepartmentMaster;
import com.nexorcrm.backend.entity.Policy;
import com.nexorcrm.backend.repo.DepartmentMasterRepository;
import com.nexorcrm.backend.repo.PolicyRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Service
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final DepartmentMasterRepository departmentRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public PolicyService(PolicyRepository policyRepository, DepartmentMasterRepository departmentRepository) {
        this.policyRepository = policyRepository;
        this.departmentRepository = departmentRepository;
    }

    public List<PolicyResponse> list() {
        return policyRepository.findByDeletedFalseOrderByIdDesc()
                .stream().map(this::toResponse).toList();
    }

    public PolicyResponse create(PolicyRequest request, MultipartFile file) {
        DepartmentMaster dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));

        Policy p = new Policy();
        p.setName(request.getName().trim());
        p.setDescription(request.getDescription());
        p.setDepartment(dept);

        if (file != null && !file.isEmpty()) {
            applyFile(p, file);
        }

        return toResponse(policyRepository.save(p));
    }

    public PolicyResponse update(Long id, PolicyRequest request, MultipartFile file) {
        Policy p = policyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Policy not found"));
        if (Boolean.TRUE.equals(p.getDeleted())) {
            throw new EntityNotFoundException("Policy not found");
        }

        DepartmentMaster dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));

        p.setName(request.getName().trim());
        p.setDescription(request.getDescription());
        p.setDepartment(dept);

        if (file != null && !file.isEmpty()) {
            applyFile(p, file);
        }

        return toResponse(policyRepository.save(p));
    }

    public void delete(Long id) {
        Policy p = policyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Policy not found"));
        p.setDeleted(true);
        policyRepository.save(p);
    }

    public Resource getFileResource(Long id) {
        Policy p = policyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Policy not found"));
        if (Boolean.TRUE.equals(p.getDeleted())) {
            throw new EntityNotFoundException("Policy not found");
        }
        if (p.getFilePath() == null || p.getFilePath().isBlank()) {
            throw new EntityNotFoundException("File not found");
        }
        FileSystemResource resource = new FileSystemResource(p.getFilePath());
        if (!resource.exists() || !resource.isReadable()) {
            throw new EntityNotFoundException("File not found");
        }
        return resource;
    }

    public Policy getPolicy(Long id) {
        Policy p = policyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Policy not found"));
        if (Boolean.TRUE.equals(p.getDeleted())) {
            throw new EntityNotFoundException("Policy not found");
        }
        return p;
    }

    private void applyFile(Policy p, MultipartFile file) {
        try {
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String original = file.getOriginalFilename();
            String ext = "";
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf("."));
            }
            String storedName = UUID.randomUUID() + ext;
            Path target = Path.of(uploadDir, storedName);
            Files.copy(file.getInputStream(), target);

            p.setFileName(original);
            p.setFilePath(target.toString());
            p.setFileType(file.getContentType());
            p.setFileSize(file.getSize());
        } catch (Exception e) {
            throw new RuntimeException("File upload failed");
        }
    }

    private PolicyResponse toResponse(Policy p) {
        PolicyResponse r = new PolicyResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setDescription(p.getDescription());
        r.setDepartmentId(p.getDepartment().getId());
        r.setDepartmentName(p.getDepartment().getName());
        r.setFileName(p.getFileName());
        r.setFilePath(p.getFilePath());
        r.setFileType(p.getFileType());
        r.setFileSize(p.getFileSize());
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }
}
