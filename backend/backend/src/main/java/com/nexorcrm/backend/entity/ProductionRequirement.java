package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "production_requirements")
public class ProductionRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long leadId;

    @Column(length = 100)
    private String requirementType; // "Production" or "Design + Production"

    @Column(columnDefinition = "TEXT")
    private String requirementNotes;

    private String requirementFileName;
    private String requirementFilePath;

    // ===== 1. Product Details =====
    @Column(length = 160)
    private String productType; // Business Card, Flyer, Brochure, Poster, Banner, Sticker, Packaging

    @Column(length = 255)
    private String customProductType;

    private Integer quantity;
    private Integer numPages; // For brochures/booklets

    // ===== 2. Size Details =====
    @Column(length = 100)
    private String paperSize; // A0, A1, A2, A3, A4, A5, Business Card, Custom

    private Double customSizeWidth;
    private Double customSizeHeight;

    @Column(length = 20)
    private String customSizeUnit; // mm or inches

    // ===== 3. Paper Specifications =====
    @Column(length = 100)
    private String paperType; // Matte, Glossy, Art Paper, Art Card, Sticker, Vinyl

    @Column(length = 100)
    private String paperGsm; // 100, 130, 170, 250, 300

    // ===== 4. Printing Specifications =====
    @Column(length = 100)
    private String colorType; // Full Color (CMYK), Black & White, Pantone

    @Column(length = 100)
    private String printSides; // Single Side, Double Side

    @Column(length = 100)
    private String printingMethod; // Digital Printing, Offset Printing, Large Format

    // ===== 5. Finishing Options (JSON - MultiSelect) =====
    @Column(columnDefinition = "TEXT")
    private String finishingOptions; // JSON array: ["Matte Lamination", "Gloss Lamination", "Spot UV", "Emboss", "Foil Stamping", "Die Cut", "Folding"]

    // If Folding selected
    @Column(length = 100)
    private String foldingType; // Bi-Fold, Tri-Fold, Z-Fold

    // ===== 6. Client Artwork Upload =====
    private String artworkFileName;
    private String artworkFilePath;

    @Column(columnDefinition = "TEXT")
    private String additionalNotes;

    // ===== 7. Deadline & Delivery =====
    private LocalDateTime productionPrintDeadline;
    private LocalDateTime productionDeliveryDate;
    @Column(length = 100)
    private String productionPriority;

    // ===== Audit Fields =====
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Long createdBy;
    private Long updatedBy;

    @Column(name = "assigned_to")
    private Long assignedTo;

    // ===== Lifecycle Callbacks =====
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ===== Getters and Setters =====
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

    public String getProductType() {
        return productType;
    }

    public void setProductType(String productType) {
        this.productType = productType;
    }

    public String getCustomProductType() {
        return customProductType;
    }

    public void setCustomProductType(String customProductType) {
        this.customProductType = customProductType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getNumPages() {
        return numPages;
    }

    public void setNumPages(Integer numPages) {
        this.numPages = numPages;
    }

    public String getPaperSize() {
        return paperSize;
    }

    public void setPaperSize(String paperSize) {
        this.paperSize = paperSize;
    }

    public Double getCustomSizeWidth() {
        return customSizeWidth;
    }

    public void setCustomSizeWidth(Double customSizeWidth) {
        this.customSizeWidth = customSizeWidth;
    }

    public Double getCustomSizeHeight() {
        return customSizeHeight;
    }

    public void setCustomSizeHeight(Double customSizeHeight) {
        this.customSizeHeight = customSizeHeight;
    }

    public String getCustomSizeUnit() {
        return customSizeUnit;
    }

    public void setCustomSizeUnit(String customSizeUnit) {
        this.customSizeUnit = customSizeUnit;
    }

    public String getPaperType() {
        return paperType;
    }

    public void setPaperType(String paperType) {
        this.paperType = paperType;
    }

    public String getPaperGsm() {
        return paperGsm;
    }

    public void setPaperGsm(String paperGsm) {
        this.paperGsm = paperGsm;
    }

    public String getColorType() {
        return colorType;
    }

    public void setColorType(String colorType) {
        this.colorType = colorType;
    }

    public String getPrintSides() {
        return printSides;
    }

    public void setPrintSides(String printSides) {
        this.printSides = printSides;
    }

    public String getPrintingMethod() {
        return printingMethod;
    }

    public void setPrintingMethod(String printingMethod) {
        this.printingMethod = printingMethod;
    }

    public String getFinishingOptions() {
        return finishingOptions;
    }

    public void setFinishingOptions(String finishingOptions) {
        this.finishingOptions = finishingOptions;
    }

    public String getFoldingType() {
        return foldingType;
    }

    public void setFoldingType(String foldingType) {
        this.foldingType = foldingType;
    }

    public String getArtworkFileName() {
        return artworkFileName;
    }

    public void setArtworkFileName(String artworkFileName) {
        this.artworkFileName = artworkFileName;
    }

    public String getArtworkFilePath() {
        return artworkFilePath;
    }

    public void setArtworkFilePath(String artworkFilePath) {
        this.artworkFilePath = artworkFilePath;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
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

    public LocalDateTime getProductionPrintDeadline() {
        return productionPrintDeadline;
    }

    public void setProductionPrintDeadline(LocalDateTime productionPrintDeadline) {
        this.productionPrintDeadline = productionPrintDeadline;
    }

    public LocalDateTime getProductionDeliveryDate() {
        return productionDeliveryDate;
    }

    public void setProductionDeliveryDate(LocalDateTime productionDeliveryDate) {
        this.productionDeliveryDate = productionDeliveryDate;
    }

    public String getProductionPriority() {
        return productionPriority;
    }

    public void setProductionPriority(String productionPriority) {
        this.productionPriority = productionPriority;
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
    }


}




