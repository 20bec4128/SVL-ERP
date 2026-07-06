package com.nexorcrm.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class RequirementResponse {

    private Long id;
    private Long leadId;
    private Long categoryId;
    private String categoryName;
    private Long typeId;
    private String typeName;
    private Long subtypeId;
    private String subtypeName;
    private Integer quantity;
    private String specs;

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

    // Audit
    private Long employeeId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Files
    private List<RequirementFileResponse> files;

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public Long getTypeId() { return typeId; }
    public void setTypeId(Long typeId) { this.typeId = typeId; }

    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }

    public Long getSubtypeId() { return subtypeId; }
    public void setSubtypeId(Long subtypeId) { this.subtypeId = subtypeId; }

    public String getSubtypeName() { return subtypeName; }
    public void setSubtypeName(String subtypeName) { this.subtypeName = subtypeName; }

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

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<RequirementFileResponse> getFiles() { return files; }
    public void setFiles(List<RequirementFileResponse> files) { this.files = files; }
}
