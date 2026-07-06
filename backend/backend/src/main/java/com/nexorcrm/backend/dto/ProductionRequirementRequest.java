package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class ProductionRequirementRequest {

    private Long leadId;
    private String requirementType; // "Production" or "Design + Production"
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
    private String finishingOptions; // JSON array
    private String foldingType;

    // Client Artwork Upload
    private String artworkFileName;
    private String artworkFilePath;
    private String additionalNotes;
    private LocalDateTime productionPrintDeadline;
    private LocalDateTime productionDeliveryDate;
    private String priority; // "Normal", "Urgent", "Express"
    private Long assignedTo;

    // Getters and Setters
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

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
    }

}



