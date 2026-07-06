package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.RequirementFileResponse;
import com.nexorcrm.backend.dto.RequirementRequest;
import com.nexorcrm.backend.dto.RequirementResponse;
import com.nexorcrm.backend.entity.Requirement;
import com.nexorcrm.backend.entity.RequirementFile;
import com.nexorcrm.backend.entity.ServiceCategory;
import com.nexorcrm.backend.entity.ServiceType;
import com.nexorcrm.backend.repo.LeadRepository;
import com.nexorcrm.backend.repo.RequirementFileRepository;
import com.nexorcrm.backend.repo.RequirementRepository;
import com.nexorcrm.backend.repo.ServiceCategoryRepository;
import com.nexorcrm.backend.repo.ServiceTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RequirementService {

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private RequirementFileRepository requirementFileRepository;

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private ServiceTypeRepository serviceTypeRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Transactional
    public RequirementResponse createRequirement(RequirementRequest request, List<MultipartFile> files, Long userId) {
        if (request.getLeadId() == null || request.getLeadId() <= 0) {
            throw new IllegalArgumentException("Lead ID is required and must be positive");
        }

        Requirement requirement = new Requirement();
        mapRequestToEntity(request, requirement);
        requirement.setEmployeeId(userId);

        Requirement saved = requirementRepository.save(requirement);
        promoteLeadToRequirementStatus(saved.getLeadId());

        // Handle file uploads
        List<RequirementFile> savedFiles = new ArrayList<>();
        if (files != null && !files.isEmpty()) {
            savedFiles = saveFiles(saved.getId(), files);
        }

        return mapEntityToResponse(saved, savedFiles);
    }

    @Transactional
    public RequirementResponse updateRequirement(Long id, RequirementRequest request, List<MultipartFile> files, Long userId) {
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requirement not found with id: " + id));

        mapRequestToEntity(request, requirement);

        Requirement saved = requirementRepository.save(requirement);
        promoteLeadToRequirementStatus(saved.getLeadId());

        // Handle new file uploads (append, don't replace)
        if (files != null && !files.isEmpty()) {
            saveFiles(saved.getId(), files);
        }

        List<RequirementFile> allFiles = requirementFileRepository.findByRequirementId(saved.getId());
        return mapEntityToResponse(saved, allFiles);
    }

    @Transactional(readOnly = true)
    public List<RequirementResponse> getRequirementsByLeadId(Long leadId) {
        if (leadId == null || leadId <= 0) {
            throw new IllegalArgumentException("Valid lead ID is required");
        }

        List<Requirement> requirements = requirementRepository.findByLeadIdOrderByCreatedAtDesc(leadId);
        return requirements.stream().map(req -> {
            List<RequirementFile> files = requirementFileRepository.findByRequirementId(req.getId());
            return mapEntityToResponse(req, files);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RequirementResponse getRequirementById(Long id) {
        Optional<Requirement> opt = requirementRepository.findById(id);
        if (opt.isEmpty()) {
            return null;
        }
        Requirement req = opt.get();
        List<RequirementFile> files = requirementFileRepository.findByRequirementId(req.getId());
        return mapEntityToResponse(req, files);
    }

    @Transactional
    public void deleteRequirement(Long id) {
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requirement not found with id: " + id));

        // Delete files from disk
        List<RequirementFile> files = requirementFileRepository.findByRequirementId(id);
        for (RequirementFile file : files) {
            try {
                Path filePath = Paths.get(file.getSavedPath()).toAbsolutePath().normalize();
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log but don't fail the delete
            }
        }

        requirementFileRepository.deleteByRequirementId(id);
        requirementRepository.delete(requirement);
    }

    @Transactional
    public void deleteRequirementFile(Long fileId) {
        RequirementFile file = requirementFileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found with id: " + fileId));

        try {
            Path filePath = Paths.get(file.getSavedPath()).toAbsolutePath().normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log but don't fail
        }

        requirementFileRepository.delete(file);
    }

    // ===== Helper Methods =====

    private List<RequirementFile> saveFiles(Long requirementId, List<MultipartFile> files) {
        List<RequirementFile> savedFiles = new ArrayList<>();
        Path dir = Paths.get(uploadDir, "requirements", String.valueOf(requirementId)).toAbsolutePath().normalize();

        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                originalFilename = "unnamed";
            }

            // Sanitize filename
            String sanitized = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            String savedFilename = System.currentTimeMillis() + "_" + sanitized;
            Path filePath = dir.resolve(savedFilename);

            // Validate path doesn't escape upload directory
            if (!filePath.normalize().startsWith(dir)) {
                throw new SecurityException("Invalid file path");
            }

            try {
                file.transferTo(filePath.toFile());
            } catch (IOException e) {
                throw new RuntimeException("Failed to save file: " + originalFilename, e);
            }

            RequirementFile reqFile = new RequirementFile();
            reqFile.setRequirementId(requirementId);
            reqFile.setOriginalFilename(originalFilename);
            reqFile.setSavedPath(filePath.toString());
            reqFile.setFileType(file.getContentType());
            reqFile.setFileSize(file.getSize());

            savedFiles.add(requirementFileRepository.save(reqFile));
        }

        return savedFiles;
    }

    private void mapRequestToEntity(RequirementRequest request, Requirement entity) {
        entity.setLeadId(request.getLeadId());
        entity.setCategoryId(request.getCategoryId());
        entity.setTypeId(request.getTypeId());
        entity.setSubtypeId(request.getSubtypeId());
        entity.setQuantity(request.getQuantity());
        entity.setSpecs(request.getSpecs());
        entity.setDesignStatus(request.getDesignStatus());
        entity.setDesignNotes(request.getDesignNotes());
        entity.setFileFormat(request.getFileFormat());
        entity.setColourMode(request.getColourMode());
        entity.setStylePreference(request.getStylePreference());
        entity.setColourPreference(request.getColourPreference());
        entity.setReferenceNotes(request.getReferenceNotes());
        entity.setBrandColours(request.getBrandColours());
        entity.setDeliveryDate(request.getDeliveryDate());
        entity.setSpecialInstructions(request.getSpecialInstructions());
    }

    private void promoteLeadToRequirementStatus(Long leadId) {
        if (leadId == null) {
            return;
        }
        leadRepository.findByIdAndDeletedFalse(leadId).ifPresent(lead -> {
            String currentStatus = normalizeStatusKey(lead.getStatus());
            if (currentStatus.equals("requirement")
                    || currentStatus.equals("budget")
                    || currentStatus.equals("payment")
                    || currentStatus.equals("design")
                    || currentStatus.equals("production")
                    || currentStatus.equals("deal")
                    || currentStatus.equals("delivery")
                    || currentStatus.equals("accounts")
                    || currentStatus.equals("completed")
                    || currentStatus.equals("rejected")) {
                return;
            }
            lead.setStatus("Requirement");
            leadRepository.save(lead);
        });
    }

    private String normalizeStatusKey(String value) {
        String key = String.valueOf(value == null ? "" : value).trim().toLowerCase(Locale.ROOT);
        return switch (key) {
            case "new" -> "new lead";
            case "requirement collected", "requirements collected" -> "requirement";
            case "design & production", "design and production" -> "design + production";
            case "stock requested" -> "stock request";
            default -> key;
        };
    }

    private RequirementResponse mapEntityToResponse(Requirement entity, List<RequirementFile> files) {
        RequirementResponse response = new RequirementResponse();
        response.setId(entity.getId());
        response.setLeadId(entity.getLeadId());
        response.setCategoryId(entity.getCategoryId());
        response.setTypeId(entity.getTypeId());
        response.setSubtypeId(entity.getSubtypeId());
        response.setQuantity(entity.getQuantity());
        response.setSpecs(entity.getSpecs());
        response.setDesignStatus(entity.getDesignStatus());
        response.setDesignNotes(entity.getDesignNotes());
        response.setFileFormat(entity.getFileFormat());
        response.setColourMode(entity.getColourMode());
        response.setStylePreference(entity.getStylePreference());
        response.setColourPreference(entity.getColourPreference());
        response.setReferenceNotes(entity.getReferenceNotes());
        response.setBrandColours(entity.getBrandColours());
        response.setDeliveryDate(entity.getDeliveryDate());
        response.setSpecialInstructions(entity.getSpecialInstructions());
        response.setEmployeeId(entity.getEmployeeId());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        // Resolve category/type/subtype names
        if (entity.getCategoryId() != null) {
            serviceCategoryRepository.findById(entity.getCategoryId())
                    .ifPresent(cat -> response.setCategoryName(cat.getName()));
        }
        if (entity.getTypeId() != null) {
            serviceTypeRepository.findById(entity.getTypeId())
                    .ifPresent(type -> response.setTypeName(type.getName()));
        }
        if (entity.getSubtypeId() != null) {
            serviceTypeRepository.findById(entity.getSubtypeId())
                    .ifPresent(subtype -> response.setSubtypeName(subtype.getName()));
        }

        // Map files
        if (files != null) {
            response.setFiles(files.stream().map(this::mapFileToResponse).collect(Collectors.toList()));
        }

        return response;
    }

    private RequirementFileResponse mapFileToResponse(RequirementFile file) {
        RequirementFileResponse resp = new RequirementFileResponse();
        resp.setId(file.getId());
        resp.setRequirementId(file.getRequirementId());
        resp.setOriginalFilename(file.getOriginalFilename());
        resp.setSavedPath(file.getSavedPath());
        resp.setFileType(file.getFileType());
        resp.setFileSize(file.getFileSize());
        resp.setUploadedAt(file.getUploadedAt());
        return resp;
    }
}
