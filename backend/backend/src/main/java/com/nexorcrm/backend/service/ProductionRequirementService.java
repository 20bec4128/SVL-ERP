package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.ProductionRequirementRequest;
import com.nexorcrm.backend.dto.ProductionRequirementResponse;
import com.nexorcrm.backend.entity.ProductionRequirement;
import com.nexorcrm.backend.repo.ProductionRequirementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ProductionRequirementService {

    @Autowired
    private ProductionRequirementRepository productionRequirementRepository;

    @Transactional
    public ProductionRequirementResponse saveProductionRequirement(ProductionRequirementRequest request, Long userId) {
        if (request.getLeadId() == null || request.getLeadId() <= 0) {
            throw new IllegalArgumentException("Lead ID is required and must be positive");
        }

        ProductionRequirement requirement;

        // Check if requirement already exists for this lead
        Optional<ProductionRequirement> existing = productionRequirementRepository.findByLeadId(request.getLeadId());

        if (existing.isPresent()) {
            // Update existing
            requirement = existing.get();
            mapRequestToEntity(request, requirement);
            requirement.setUpdatedBy(userId);
            requirement.setUpdatedAt(LocalDateTime.now());
        } else {
            // Create new
            requirement = new ProductionRequirement();
            mapRequestToEntity(request, requirement);
            requirement.setCreatedBy(userId);
            requirement.setUpdatedBy(userId);
        }

        ProductionRequirement saved = productionRequirementRepository.save(requirement);
        return mapEntityToResponse(saved);
    }

    @Transactional(readOnly = true)
    public ProductionRequirementResponse getProductionRequirement(Long leadId) {
        if (leadId == null || leadId <= 0) {
            throw new IllegalArgumentException("Valid lead ID is required");
        }

        Optional<ProductionRequirement> requirement = productionRequirementRepository.findByLeadId(leadId);
        return requirement.map(this::mapEntityToResponse).orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean existsForLead(Long leadId) {
        if (leadId == null || leadId <= 0) {
            return false;
        }
        return productionRequirementRepository.existsByLeadId(leadId);
    }

    @Transactional
    public void deleteProductionRequirement(Long leadId) {
        if (leadId == null || leadId <= 0) {
            throw new IllegalArgumentException("Valid lead ID is required");
        }

        Optional<ProductionRequirement> requirement = productionRequirementRepository.findByLeadId(leadId);
        requirement.ifPresent(productionRequirementRepository::delete);
    }

    // ===== Helper Methods =====

    private void mapRequestToEntity(ProductionRequirementRequest request, ProductionRequirement entity) {
        entity.setLeadId(request.getLeadId());
        entity.setRequirementType(request.getRequirementType());
        entity.setRequirementNotes(request.getRequirementNotes());
        entity.setRequirementFileName(request.getRequirementFileName());
        entity.setRequirementFilePath(request.getRequirementFilePath());

        entity.setProductType(request.getProductType());
        entity.setCustomProductType(request.getCustomProductType());
        entity.setQuantity(request.getQuantity());
        entity.setNumPages(request.getNumPages());

        entity.setPaperSize(request.getPaperSize());
        entity.setCustomSizeWidth(request.getCustomSizeWidth());
        entity.setCustomSizeHeight(request.getCustomSizeHeight());
        entity.setCustomSizeUnit(request.getCustomSizeUnit());

        entity.setPaperType(request.getPaperType());
        entity.setPaperGsm(request.getPaperGsm());

        entity.setColorType(request.getColorType());
        entity.setPrintSides(request.getPrintSides());
        entity.setPrintingMethod(request.getPrintingMethod());

        entity.setFinishingOptions(request.getFinishingOptions());
        entity.setFoldingType(request.getFoldingType());

        entity.setArtworkFileName(request.getArtworkFileName());
        entity.setArtworkFilePath(request.getArtworkFilePath());
        entity.setAdditionalNotes(request.getAdditionalNotes());
        entity.setProductionPrintDeadline(request.getProductionPrintDeadline());
        entity.setProductionDeliveryDate(request.getProductionDeliveryDate());
        entity.setProductionPriority(request.getPriority());
        entity.setAssignedTo(request.getAssignedTo());
    }

    private ProductionRequirementResponse mapEntityToResponse(ProductionRequirement entity) {
        ProductionRequirementResponse response = new ProductionRequirementResponse(
                entity.getId(),
                entity.getLeadId(),
                entity.getRequirementType(),
                entity.getRequirementNotes(),
                entity.getRequirementFileName(),
                entity.getRequirementFilePath(),
                entity.getProductType(),
                entity.getCustomProductType(),
                entity.getQuantity(),
                entity.getNumPages(),
                entity.getPaperSize(),
                entity.getCustomSizeWidth(),
                entity.getCustomSizeHeight(),
                entity.getCustomSizeUnit(),
                entity.getPaperType(),
                entity.getPaperGsm(),
                entity.getColorType(),
                entity.getPrintSides(),
                entity.getPrintingMethod(),
                entity.getFinishingOptions(),
                entity.getFoldingType(),
                entity.getArtworkFileName(),
                entity.getArtworkFilePath(),
                entity.getAdditionalNotes(),
                entity.getProductionPrintDeadline(),
                entity.getProductionDeliveryDate(),
                entity.getProductionPriority(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy(),
                entity.getUpdatedBy()
        );
        response.setAssignedTo(entity.getAssignedTo());
        return response;
    }
}


