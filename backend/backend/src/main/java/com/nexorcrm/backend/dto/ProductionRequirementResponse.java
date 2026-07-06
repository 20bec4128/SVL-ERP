package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class ProductionRequirementResponse {

    private Long id;
    private Long leadId;
    private String requirementType;
    private String requirementNotes;
    private String requirementFileName;
    private String requirementFilePath;

    // Product Details
    private String productType;
    private String customProductType;
    private Integer quantity;
    private Integer numPages;

    // Size Details
    private String paperSize;
    private Double customSizeWidth;
    private Double customSizeHeight;
    private String customSizeUnit;

    // Paper Specifications
    private String paperType;
    private String paperGsm;

    // Printing Specifications
    private String colorType;
    private String printSides;
    private String printingMethod;

    // Finishing Options
    private String finishingOptions;
    private String foldingType;

    // Client Artwork Upload
    private String artworkFileName;
    private String artworkFilePath;
    private String additionalNotes;
    private LocalDateTime printDeadline;
    private LocalDateTime deliveryDate;
    private String priority;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
    private Long assignedTo;

    // Constructor
    public ProductionRequirementResponse() {
    }

    public ProductionRequirementResponse(
            Long id,
            Long leadId,
            String requirementType,
            String requirementNotes,
            String requirementFileName,
            String requirementFilePath,
            String productType,
            String customProductType,
            Integer quantity,
            Integer numPages,
            String paperSize,
            Double customSizeWidth,
            Double customSizeHeight,
            String customSizeUnit,
            String paperType,
            String paperGsm,
            String colorType,
            String printSides,
            String printingMethod,
            String finishingOptions,
            String foldingType,
            String artworkFileName,
            String artworkFilePath,
            String additionalNotes,
            LocalDateTime printDeadline,
            LocalDateTime deliveryDate,
            String priority,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            Long createdBy,
            Long updatedBy) {
        this.id = id;
        this.leadId = leadId;
        this.requirementType = requirementType;
        this.requirementNotes = requirementNotes;
        this.requirementFileName = requirementFileName;
        this.requirementFilePath = requirementFilePath;
        this.productType = productType;
        this.customProductType = customProductType;
        this.quantity = quantity;
        this.numPages = numPages;
        this.paperSize = paperSize;
        this.customSizeWidth = customSizeWidth;
        this.customSizeHeight = customSizeHeight;
        this.customSizeUnit = customSizeUnit;
        this.paperType = paperType;
        this.paperGsm = paperGsm;
        this.colorType = colorType;
        this.printSides = printSides;
        this.printingMethod = printingMethod;
        this.finishingOptions = finishingOptions;
        this.foldingType = foldingType;
        this.artworkFileName = artworkFileName;
        this.artworkFilePath = artworkFilePath;
        this.additionalNotes = additionalNotes;
        this.printDeadline = printDeadline;
        this.deliveryDate = deliveryDate;
        this.priority = priority;
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

    public LocalDateTime getPrintDeadline() {
        return printDeadline;
    }

    public void setPrintDeadline(LocalDateTime printDeadline) {
        this.printDeadline = printDeadline;
    }

    public LocalDateTime getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(LocalDateTime deliveryDate) {
        this.deliveryDate = deliveryDate;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
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
