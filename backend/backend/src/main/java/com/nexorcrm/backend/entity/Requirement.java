package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "requirements")
public class Requirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lead_id", nullable = false)
    private Long leadId;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "type_id")
    private Long typeId;

    @Column(name = "subtype_id")
    private Long subtypeId;

    private Integer quantity;

    @Column(columnDefinition = "TEXT")
    private String specs;

    @Column(name = "design_status", length = 50)
    private String designStatus;

    @Column(name = "design_notes", columnDefinition = "TEXT")
    private String designNotes;

    @Column(name = "file_format", length = 50)
    private String fileFormat;

    @Column(name = "colour_mode", length = 50)
    private String colourMode;

    @Column(name = "style_preference", length = 100)
    private String stylePreference;

    @Column(name = "colour_preference", length = 255)
    private String colourPreference;

    @Column(name = "reference_notes", columnDefinition = "TEXT")
    private String referenceNotes;

    @Column(name = "brand_colours", length = 255)
    private String brandColours;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "special_instructions", columnDefinition = "TEXT")
    private String specialInstructions;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // --- Transient fields for response enrichment ---
    @Transient
    private String categoryName;

    @Transient
    private String typeName;

    @Transient
    private String subtypeName;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // --- Getters and Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }

    public String getSubtypeName() { return subtypeName; }
    public void setSubtypeName(String subtypeName) { this.subtypeName = subtypeName; }
}
