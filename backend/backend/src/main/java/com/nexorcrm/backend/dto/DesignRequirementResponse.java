package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class DesignRequirementResponse {

    private Long id;
    private Long leadId;
    private String requirementType; // "Design", "Production", "Design + Production"
    private String requirementNotes;
    private String requirementFileName;
    private String requirementFilePath;

    // Design Brief Fields
    private String designProductType;
    private String designCustomProductType;
    private String designSize;
    private String designCustomSize;
    private String designOrientation;
    private Integer designNumPages;
    private String designDescription;
    private String designPurpose;
    private String designCustomPurpose;
    private String designTargetAudience;
    private String designStylePref;
    private String designBrandColors;
    private String designFonts;
    private String designBrandGuidelinesFileName;
    private String designBrandGuidelinesFilePath;
    private String designLogoFileName;
    private String designLogoFilePath;
    private String designImagesFileName;
    private String designImagesFilePath;
    private String designTextContent;
    private String designWebsite;
    private String designPhone;
    private String designPhoneCountryCode;
    private String designAddress;
    private String designSocialMedia;
    private String designQrCode;
    private String designReferenceImagesFileName;
    private String designReferenceImagesFilePath;
    private String designReferenceLinks;
    private String designPreviousDesignsFileName;
    private String designPreviousDesignsFilePath;
    private LocalDateTime designDeadline;
    private String designPriority;
    private String designCustomPriority;
    private String designAdditionalNotes;
    private String designRestrictions;
    private String designColorPrefs;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
    private Long assignedTo;

    public DesignRequirementResponse() {
    }

    public DesignRequirementResponse(
        Long id, Long leadId, String requirementType, String requirementNotes,
        String requirementFileName, String requirementFilePath,
        String designProductType, String designCustomProductType,
        String designSize, String designCustomSize, String designOrientation,
        Integer designNumPages, String designDescription, String designPurpose,
        String designCustomPurpose, String designTargetAudience, String designStylePref,
        String designBrandColors, String designFonts, String designBrandGuidelinesFileName,
        String designBrandGuidelinesFilePath, String designLogoFileName,
        String designLogoFilePath, String designImagesFileName, String designImagesFilePath,
        String designTextContent, String designWebsite, String designPhone,
        String designPhoneCountryCode, String designAddress, String designSocialMedia,
        String designQrCode, String designReferenceImagesFileName, String designReferenceImagesFilePath,
        String designReferenceLinks, String designPreviousDesignsFileName, String designPreviousDesignsFilePath,
        LocalDateTime designDeadline, String designPriority, String designCustomPriority,
        String designAdditionalNotes, String designRestrictions, String designColorPrefs,
        LocalDateTime createdAt, LocalDateTime updatedAt, Long createdBy, Long updatedBy
    ) {
        this.id = id;
        this.leadId = leadId;
        this.requirementType = requirementType;
        this.requirementNotes = requirementNotes;
        this.requirementFileName = requirementFileName;
        this.requirementFilePath = requirementFilePath;
        this.designProductType = designProductType;
        this.designCustomProductType = designCustomProductType;
        this.designSize = designSize;
        this.designCustomSize = designCustomSize;
        this.designOrientation = designOrientation;
        this.designNumPages = designNumPages;
        this.designDescription = designDescription;
        this.designPurpose = designPurpose;
        this.designCustomPurpose = designCustomPurpose;
        this.designTargetAudience = designTargetAudience;
        this.designStylePref = designStylePref;
        this.designBrandColors = designBrandColors;
        this.designFonts = designFonts;
        this.designBrandGuidelinesFileName = designBrandGuidelinesFileName;
        this.designBrandGuidelinesFilePath = designBrandGuidelinesFilePath;
        this.designLogoFileName = designLogoFileName;
        this.designLogoFilePath = designLogoFilePath;
        this.designImagesFileName = designImagesFileName;
        this.designImagesFilePath = designImagesFilePath;
        this.designTextContent = designTextContent;
        this.designWebsite = designWebsite;
        this.designPhone = designPhone;
        this.designPhoneCountryCode = designPhoneCountryCode;
        this.designAddress = designAddress;
        this.designSocialMedia = designSocialMedia;
        this.designQrCode = designQrCode;
        this.designReferenceImagesFileName = designReferenceImagesFileName;
        this.designReferenceImagesFilePath = designReferenceImagesFilePath;
        this.designReferenceLinks = designReferenceLinks;
        this.designPreviousDesignsFileName = designPreviousDesignsFileName;
        this.designPreviousDesignsFilePath = designPreviousDesignsFilePath;
        this.designDeadline = designDeadline;
        this.designPriority = designPriority;
        this.designCustomPriority = designCustomPriority;
        this.designAdditionalNotes = designAdditionalNotes;
        this.designRestrictions = designRestrictions;
        this.designColorPrefs = designColorPrefs;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdBy = createdBy;
        this.updatedBy = updatedBy;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public String getRequirementType() {
        return requirementType;
    }

    public void setRequirementType(String requirementType) {
        this.requirementType = requirementType;
    }

    public String getRequirementNotes() {
        return requirementNotes;
    }

    public void setRequirementNotes(String requirementNotes) {
        this.requirementNotes = requirementNotes;
    }

    public String getRequirementFileName() {
        return requirementFileName;
    }

    public void setRequirementFileName(String requirementFileName) {
        this.requirementFileName = requirementFileName;
    }

    public String getRequirementFilePath() {
        return requirementFilePath;
    }

    public void setRequirementFilePath(String requirementFilePath) {
        this.requirementFilePath = requirementFilePath;
    }

    public String getDesignProductType() {
        return designProductType;
    }

    public void setDesignProductType(String designProductType) {
        this.designProductType = designProductType;
    }

    public String getDesignCustomProductType() {
        return designCustomProductType;
    }

    public void setDesignCustomProductType(String designCustomProductType) {
        this.designCustomProductType = designCustomProductType;
    }

    public String getDesignSize() {
        return designSize;
    }

    public void setDesignSize(String designSize) {
        this.designSize = designSize;
    }

    public String getDesignCustomSize() {
        return designCustomSize;
    }

    public void setDesignCustomSize(String designCustomSize) {
        this.designCustomSize = designCustomSize;
    }

    public String getDesignOrientation() {
        return designOrientation;
    }

    public void setDesignOrientation(String designOrientation) {
        this.designOrientation = designOrientation;
    }

    public Integer getDesignNumPages() {
        return designNumPages;
    }

    public void setDesignNumPages(Integer designNumPages) {
        this.designNumPages = designNumPages;
    }

    public String getDesignDescription() {
        return designDescription;
    }

    public void setDesignDescription(String designDescription) {
        this.designDescription = designDescription;
    }

    public String getDesignPurpose() {
        return designPurpose;
    }

    public void setDesignPurpose(String designPurpose) {
        this.designPurpose = designPurpose;
    }

    public String getDesignCustomPurpose() {
        return designCustomPurpose;
    }

    public void setDesignCustomPurpose(String designCustomPurpose) {
        this.designCustomPurpose = designCustomPurpose;
    }

    public String getDesignTargetAudience() {
        return designTargetAudience;
    }

    public void setDesignTargetAudience(String designTargetAudience) {
        this.designTargetAudience = designTargetAudience;
    }

    public String getDesignStylePref() {
        return designStylePref;
    }

    public void setDesignStylePref(String designStylePref) {
        this.designStylePref = designStylePref;
    }

    public String getDesignBrandColors() {
        return designBrandColors;
    }

    public void setDesignBrandColors(String designBrandColors) {
        this.designBrandColors = designBrandColors;
    }

    public String getDesignFonts() {
        return designFonts;
    }

    public void setDesignFonts(String designFonts) {
        this.designFonts = designFonts;
    }

    public String getDesignBrandGuidelinesFileName() {
        return designBrandGuidelinesFileName;
    }

    public void setDesignBrandGuidelinesFileName(String designBrandGuidelinesFileName) {
        this.designBrandGuidelinesFileName = designBrandGuidelinesFileName;
    }

    public String getDesignBrandGuidelinesFilePath() {
        return designBrandGuidelinesFilePath;
    }

    public void setDesignBrandGuidelinesFilePath(String designBrandGuidelinesFilePath) {
        this.designBrandGuidelinesFilePath = designBrandGuidelinesFilePath;
    }

    public String getDesignLogoFileName() {
        return designLogoFileName;
    }

    public void setDesignLogoFileName(String designLogoFileName) {
        this.designLogoFileName = designLogoFileName;
    }

    public String getDesignLogoFilePath() {
        return designLogoFilePath;
    }

    public void setDesignLogoFilePath(String designLogoFilePath) {
        this.designLogoFilePath = designLogoFilePath;
    }

    public String getDesignImagesFileName() {
        return designImagesFileName;
    }

    public void setDesignImagesFileName(String designImagesFileName) {
        this.designImagesFileName = designImagesFileName;
    }

    public String getDesignImagesFilePath() {
        return designImagesFilePath;
    }

    public void setDesignImagesFilePath(String designImagesFilePath) {
        this.designImagesFilePath = designImagesFilePath;
    }

    public String getDesignTextContent() {
        return designTextContent;
    }

    public void setDesignTextContent(String designTextContent) {
        this.designTextContent = designTextContent;
    }

    public String getDesignWebsite() {
        return designWebsite;
    }

    public void setDesignWebsite(String designWebsite) {
        this.designWebsite = designWebsite;
    }

    public String getDesignPhone() {
        return designPhone;
    }

    public void setDesignPhone(String designPhone) {
        this.designPhone = designPhone;
    }

    public String getDesignPhoneCountryCode() {
        return designPhoneCountryCode;
    }

    public void setDesignPhoneCountryCode(String designPhoneCountryCode) {
        this.designPhoneCountryCode = designPhoneCountryCode;
    }

    public String getDesignAddress() {
        return designAddress;
    }

    public void setDesignAddress(String designAddress) {
        this.designAddress = designAddress;
    }

    public String getDesignSocialMedia() {
        return designSocialMedia;
    }

    public void setDesignSocialMedia(String designSocialMedia) {
        this.designSocialMedia = designSocialMedia;
    }

    public String getDesignQrCode() {
        return designQrCode;
    }

    public void setDesignQrCode(String designQrCode) {
        this.designQrCode = designQrCode;
    }

    public String getDesignReferenceImagesFileName() {
        return designReferenceImagesFileName;
    }

    public void setDesignReferenceImagesFileName(String designReferenceImagesFileName) {
        this.designReferenceImagesFileName = designReferenceImagesFileName;
    }

    public String getDesignReferenceImagesFilePath() {
        return designReferenceImagesFilePath;
    }

    public void setDesignReferenceImagesFilePath(String designReferenceImagesFilePath) {
        this.designReferenceImagesFilePath = designReferenceImagesFilePath;
    }

    public String getDesignReferenceLinks() {
        return designReferenceLinks;
    }

    public void setDesignReferenceLinks(String designReferenceLinks) {
        this.designReferenceLinks = designReferenceLinks;
    }

    public String getDesignPreviousDesignsFileName() {
        return designPreviousDesignsFileName;
    }

    public void setDesignPreviousDesignsFileName(String designPreviousDesignsFileName) {
        this.designPreviousDesignsFileName = designPreviousDesignsFileName;
    }

    public String getDesignPreviousDesignsFilePath() {
        return designPreviousDesignsFilePath;
    }

    public void setDesignPreviousDesignsFilePath(String designPreviousDesignsFilePath) {
        this.designPreviousDesignsFilePath = designPreviousDesignsFilePath;
    }

    public LocalDateTime getDesignDeadline() {
        return designDeadline;
    }

    public void setDesignDeadline(LocalDateTime designDeadline) {
        this.designDeadline = designDeadline;
    }

    public String getDesignPriority() {
        return designPriority;
    }

    public void setDesignPriority(String designPriority) {
        this.designPriority = designPriority;
    }

    public String getDesignCustomPriority() {
        return designCustomPriority;
    }

    public void setDesignCustomPriority(String designCustomPriority) {
        this.designCustomPriority = designCustomPriority;
    }

    public String getDesignAdditionalNotes() {
        return designAdditionalNotes;
    }

    public void setDesignAdditionalNotes(String designAdditionalNotes) {
        this.designAdditionalNotes = designAdditionalNotes;
    }

    public String getDesignRestrictions() {
        return designRestrictions;
    }

    public void setDesignRestrictions(String designRestrictions) {
        this.designRestrictions = designRestrictions;
    }

    public String getDesignColorPrefs() {
        return designColorPrefs;
    }

    public void setDesignColorPrefs(String designColorPrefs) {
        this.designColorPrefs = designColorPrefs;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public Long getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Long updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
    }
}
