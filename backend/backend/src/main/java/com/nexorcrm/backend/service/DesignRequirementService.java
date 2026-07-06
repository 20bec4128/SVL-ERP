package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.DesignRequirementRequest;
import com.nexorcrm.backend.dto.DesignRequirementResponse;
import com.nexorcrm.backend.entity.DesignRequirement;
import com.nexorcrm.backend.repo.DesignRequirementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DesignRequirementService {

    @Autowired
    private DesignRequirementRepository designRequirementRepository;

    /**
     * Create or update design requirement for a lead
     */
    @Transactional
    public DesignRequirementResponse saveDesignRequirement(DesignRequirementRequest request, Long userId) {
        DesignRequirement designRequirement;

        // Check if requirement already exists for this lead
        Optional<DesignRequirement> existing = designRequirementRepository.findByLeadId(request.getLeadId());
        
        if (existing.isPresent()) {
            designRequirement = existing.get();
            designRequirement.setUpdatedBy(userId);
            designRequirement.setUpdatedAt(LocalDateTime.now());
        } else {
            designRequirement = new DesignRequirement();
            designRequirement.setLeadId(request.getLeadId());
            designRequirement.setCreatedBy(userId);
        }

        // Map request to entity
        mapRequestToEntity(request, designRequirement);

        // Save to database
        designRequirement = designRequirementRepository.save(designRequirement);

        // Convert to response
        return mapEntityToResponse(designRequirement);
    }

    /**
     * Get design requirement for a lead
     */
    @Transactional(readOnly = true)
    public DesignRequirementResponse getDesignRequirement(Long leadId) {
        Optional<DesignRequirement> requirement = designRequirementRepository.findByLeadId(leadId);
        return requirement.map(this::mapEntityToResponse).orElse(null);
    }

    /**
     * Check if design requirement exists for a lead
     */
    @Transactional(readOnly = true)
    public boolean existsForLead(Long leadId) {
        return designRequirementRepository.existsByLeadId(leadId);
    }

    /**
     * Delete design requirement for a lead
     */
    @Transactional
    public void deleteDesignRequirement(Long leadId) {
        Optional<DesignRequirement> requirement = designRequirementRepository.findByLeadId(leadId);
        requirement.ifPresent(designRequirementRepository::delete);
    }

    /**
     * Map DTO request to entity
     */
    private void mapRequestToEntity(DesignRequirementRequest request, DesignRequirement entity) {
        entity.setRequirementType(request.getRequirementType());
        entity.setRequirementNotes(request.getRequirementNotes());
        entity.setRequirementFileName(request.getRequirementFileName());
        entity.setRequirementFilePath(request.getRequirementFilePath());

        // Design Brief Fields
        entity.setDesignProductType(request.getDesignProductType());
        entity.setDesignCustomProductType(request.getDesignCustomProductType());
        entity.setDesignSize(request.getDesignSize());
        entity.setDesignCustomSize(request.getDesignCustomSize());
        entity.setDesignOrientation(request.getDesignOrientation());
        entity.setDesignNumPages(request.getDesignNumPages());
        entity.setDesignDescription(request.getDesignDescription());
        entity.setDesignPurpose(request.getDesignPurpose());
        entity.setDesignCustomPurpose(request.getDesignCustomPurpose());
        entity.setDesignTargetAudience(request.getDesignTargetAudience());
        entity.setDesignStylePref(request.getDesignStylePref());
        entity.setDesignBrandColors(request.getDesignBrandColors());
        entity.setDesignFonts(request.getDesignFonts());
        entity.setDesignBrandGuidelinesFileName(request.getDesignBrandGuidelinesFileName());
        entity.setDesignBrandGuidelinesFilePath(request.getDesignBrandGuidelinesFilePath());
        entity.setDesignLogoFileName(request.getDesignLogoFileName());
        entity.setDesignLogoFilePath(request.getDesignLogoFilePath());
        entity.setDesignImagesFileName(request.getDesignImagesFileName());
        entity.setDesignImagesFilePath(request.getDesignImagesFilePath());
        entity.setDesignTextContent(request.getDesignTextContent());
        entity.setDesignWebsite(request.getDesignWebsite());
        entity.setDesignPhone(request.getDesignPhone());
        entity.setDesignPhoneCountryCode(request.getDesignPhoneCountryCode());
        entity.setDesignAddress(request.getDesignAddress());
        entity.setDesignSocialMedia(request.getDesignSocialMedia());
        entity.setDesignQrCode(request.getDesignQrCode());
        entity.setDesignReferenceImagesFileName(request.getDesignReferenceImagesFileName());
        entity.setDesignReferenceImagesFilePath(request.getDesignReferenceImagesFilePath());
        entity.setDesignReferenceLinks(request.getDesignReferenceLinks());
        entity.setDesignPreviousDesignsFileName(request.getDesignPreviousDesignsFileName());
        entity.setDesignPreviousDesignsFilePath(request.getDesignPreviousDesignsFilePath());
        entity.setDesignDeadline(request.getDesignDeadline());
        entity.setDesignPriority(request.getDesignPriority());
        entity.setDesignCustomPriority(request.getDesignCustomPriority());
        entity.setDesignAdditionalNotes(request.getDesignAdditionalNotes());
        entity.setDesignRestrictions(request.getDesignRestrictions());
        entity.setDesignColorPrefs(request.getDesignColorPrefs());
        entity.setAssignedTo(request.getAssignedTo());
    }

    /**
     * Map entity to DTO response
     */
    private DesignRequirementResponse mapEntityToResponse(DesignRequirement entity) {
        DesignRequirementResponse response = new DesignRequirementResponse(
            entity.getId(),
            entity.getLeadId(),
            entity.getRequirementType(),
            entity.getRequirementNotes(),
            entity.getRequirementFileName(),
            entity.getRequirementFilePath(),
            entity.getDesignProductType(),
            entity.getDesignCustomProductType(),
            entity.getDesignSize(),
            entity.getDesignCustomSize(),
            entity.getDesignOrientation(),
            entity.getDesignNumPages(),
            entity.getDesignDescription(),
            entity.getDesignPurpose(),
            entity.getDesignCustomPurpose(),
            entity.getDesignTargetAudience(),
            entity.getDesignStylePref(),
            entity.getDesignBrandColors(),
            entity.getDesignFonts(),
            entity.getDesignBrandGuidelinesFileName(),
            entity.getDesignBrandGuidelinesFilePath(),
            entity.getDesignLogoFileName(),
            entity.getDesignLogoFilePath(),
            entity.getDesignImagesFileName(),
            entity.getDesignImagesFilePath(),
            entity.getDesignTextContent(),
            entity.getDesignWebsite(),
            entity.getDesignPhone(),
            entity.getDesignPhoneCountryCode(),
            entity.getDesignAddress(),
            entity.getDesignSocialMedia(),
            entity.getDesignQrCode(),
            entity.getDesignReferenceImagesFileName(),
            entity.getDesignReferenceImagesFilePath(),
            entity.getDesignReferenceLinks(),
            entity.getDesignPreviousDesignsFileName(),
            entity.getDesignPreviousDesignsFilePath(),
            entity.getDesignDeadline(),
            entity.getDesignPriority(),
            entity.getDesignCustomPriority(),
            entity.getDesignAdditionalNotes(),
            entity.getDesignRestrictions(),
            entity.getDesignColorPrefs(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getCreatedBy(),
            entity.getUpdatedBy()
        );
        response.setAssignedTo(entity.getAssignedTo());
        return response;
    }
}
