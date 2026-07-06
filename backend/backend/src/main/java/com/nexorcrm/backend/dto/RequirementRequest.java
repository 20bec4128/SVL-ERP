package com.nexorcrm.backend.dto;

import java.time.LocalDate;

public class RequirementRequest {

    private Long leadId;
    private Long categoryId;
    private Long typeId;
    private Long subtypeId;
    private Integer quantity;
    private String specs; // JSON string for dynamic product-specific fields

    // Design section
    private String designStatus;
    private String designNotes;
    private String fileFormat;
    private String colourMode;
    private String stylePreference;
    private String colourPreference;
    private String referenceNotes;
    private String brandColours;

    // Delivery
    private LocalDate deliveryDate;
    private String specialInstructions;

    // Getters and Setters

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public Long getTypeId() { return typeId; }
    public void setTypeId(Long typeId) { this.typeId = typeId; }

    public Long getSubtypeId() { return subtypeId; }
    public void setSubtypeId(Long subtypeId) { this.subtypeId = subtypeId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getSpecs() { return specs; }
    public void setSpecs(String specs) { this.specs = specs; }

    public String getDesignStatus() { return designStatus; }
    public void setDesignStatus(String designStatus) { this.designStatus = designStatus; }

    public String getDesignNotes() { return designNotes; }
    public void setDesignNotes(String designNotes) { this.designNotes = designNotes; }

    public String getFileFormat() { return fileFormat; }
    public void setFileFormat(String fileFormat) { this.fileFormat = fileFormat; }

    public String getColourMode() { return colourMode; }
    public void setColourMode(String colourMode) { this.colourMode = colourMode; }

    public String getStylePreference() { return stylePreference; }
    public void setStylePreference(String stylePreference) { this.stylePreference = stylePreference; }

    public String getColourPreference() { return colourPreference; }
    public void setColourPreference(String colourPreference) { this.colourPreference = colourPreference; }

    public String getReferenceNotes() { return referenceNotes; }
    public void setReferenceNotes(String referenceNotes) { this.referenceNotes = referenceNotes; }

    public String getBrandColours() { return brandColours; }
    public void setBrandColours(String brandColours) { this.brandColours = brandColours; }

    public LocalDate getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(LocalDate deliveryDate) { this.deliveryDate = deliveryDate; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
}
