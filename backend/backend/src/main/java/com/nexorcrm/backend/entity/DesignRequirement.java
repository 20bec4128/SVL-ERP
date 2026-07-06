package com.nexorcrm.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "design_requirements")
public class DesignRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lead_id", nullable = false)
    private Long leadId;

    @Column(name = "requirement_type", nullable = false, length = 100)
    private String requirementType; // "Design", "Production", "Design + Production"

    @Column(name = "requirement_notes", columnDefinition = "TEXT")
    private String requirementNotes;

    @Column(name = "requirement_file_name", length = 255)
    private String requirementFileName;

    @Column(name = "requirement_file_path", length = 500)
    private String requirementFilePath;

    // Design Brief Fields
    @Column(name = "design_product_type", length = 160)
    private String designProductType;

    @Column(name = "design_custom_product_type", length = 255)
    private String designCustomProductType;

    @Column(name = "design_size", length = 100)
    private String designSize;

    @Column(name = "design_custom_size", length = 255)
    private String designCustomSize;

    @Column(name = "design_orientation", length = 50)
    private String designOrientation;

    @Column(name = "design_num_pages")
    private Integer designNumPages;

    @Column(name = "design_description", columnDefinition = "TEXT")
    private String designDescription;

    @Column(name = "design_purpose", length = 160)
    private String designPurpose;

    @Column(name = "design_custom_purpose", length = 255)
    private String designCustomPurpose;

    @Column(name = "design_target_audience", columnDefinition = "TEXT")
    private String designTargetAudience;

    @Column(name = "design_style_pref", columnDefinition = "TEXT")
    private String designStylePref; // JSON array: ["Modern", "Minimal", "Corporate", "Creative"]

    @Column(name = "design_brand_colors", columnDefinition = "TEXT")
    private String designBrandColors;

    @Column(name = "design_fonts", columnDefinition = "TEXT")
    private String designFonts;

    @Column(name = "design_brand_guidelines_file_name", length = 255)
    private String designBrandGuidelinesFileName;

    @Column(name = "design_brand_guidelines_file_path", length = 500)
    private String designBrandGuidelinesFilePath;

    @Column(name = "design_logo_file_name", length = 255)
    private String designLogoFileName;

    @Column(name = "design_logo_file_path", length = 500)
    private String designLogoFilePath;

    @Column(name = "design_images_file_name", length = 255)
    private String designImagesFileName;

    @Column(name = "design_images_file_path", length = 500)
    private String designImagesFilePath;

    @Column(name = "design_text_content", columnDefinition = "TEXT")
    private String designTextContent;

    @Column(name = "design_website", length = 500)
    private String designWebsite;

    @Column(name = "design_phone", length = 40)
    private String designPhone;

    @Column(name = "design_phone_country_code", length = 20)
    private String designPhoneCountryCode;

    @Column(name = "design_address", length = 500)
    private String designAddress;

    @Column(name = "design_social_media", columnDefinition = "TEXT")
    private String designSocialMedia;

    @Column(name = "design_qr_code", length = 500)
    private String designQrCode;

    @Column(name = "design_reference_images_file_name", length = 255)
    private String designReferenceImagesFileName;

    @Column(name = "design_reference_images_file_path", length = 500)
    private String designReferenceImagesFilePath;

    @Column(name = "design_reference_links", columnDefinition = "TEXT")
    private String designReferenceLinks;

    @Column(name = "design_previous_designs_file_name", length = 255)
    private String designPreviousDesignsFileName;

    @Column(name = "design_previous_designs_file_path", length = 500)
    private String designPreviousDesignsFilePath;

    @Column(name = "design_deadline")
    private LocalDateTime designDeadline;

    @Column(name = "design_priority", length = 160)
    private String designPriority;

    @Column(name = "design_custom_priority", length = 255)
    private String designCustomPriority;

    @Column(name = "design_additional_notes", columnDefinition = "TEXT")
    private String designAdditionalNotes;

    @Column(name = "design_restrictions", columnDefinition = "TEXT")
    private String designRestrictions;

    @Column(name = "design_color_prefs", columnDefinition = "TEXT")
    private String designColorPrefs;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
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
