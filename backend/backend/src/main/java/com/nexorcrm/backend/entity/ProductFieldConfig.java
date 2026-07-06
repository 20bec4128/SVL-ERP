package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "product_field_configs")
public class ProductFieldConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_type_id", nullable = false)
    private ServiceType serviceType;

    @Column(name = "field_key", nullable = false, updatable = false, length = 120)
    private String fieldKey;

    @Column(nullable = false, length = 255)
    private String label;

    @Column(name = "field_type", nullable = false, length = 50)
    private String fieldType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> options;

    @Column(name = "is_required", nullable = false)
    private Boolean isRequired = false;

    @Column(length = 255)
    private String placeholder;

    @Column(name = "allow_custom", nullable = false)
    private Boolean allowCustom = false;

    @Column(name = "is_hidden", nullable = false)
    private Boolean isHidden = false;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "has_unit", nullable = false)
    private Boolean hasUnit = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "unit_options", columnDefinition = "jsonb")
    private List<String> unitOptions;

    @Column(name = "default_unit", length = 50)
    private String defaultUnit;

    @Column(name = "enable_3rd_dimension", nullable = false)
    private Boolean enable3rdDimension = false;

    @Column(name = "third_dimension_label", length = 120)
    private String thirdDimensionLabel;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_dimensions", columnDefinition = "jsonb")
    private List<String> customDimensions;

    @Column(name = "custom_dimension_unit", length = 20)
    private String customDimensionUnit;

    @Column(name = "custom_size_mode", length = 20)
    private String customSizeMode;

    @Column(name = "depends_on", length = 120)
    private String dependsOn;

    @Column(name = "depends_on_value", length = 255)
    private String dependsOnValue;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ServiceType getServiceType() { return serviceType; }
    public void setServiceType(ServiceType serviceType) { this.serviceType = serviceType; }

    public String getFieldKey() { return fieldKey; }
    public void setFieldKey(String fieldKey) { this.fieldKey = fieldKey; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getFieldType() { return fieldType; }
    public void setFieldType(String fieldType) { this.fieldType = fieldType; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }

    public String getPlaceholder() { return placeholder; }
    public void setPlaceholder(String placeholder) { this.placeholder = placeholder; }

    public Boolean getAllowCustom() { return allowCustom; }
    public void setAllowCustom(Boolean allowCustom) { this.allowCustom = allowCustom; }

    public Boolean getIsHidden() { return isHidden; }
    public void setIsHidden(Boolean isHidden) { this.isHidden = isHidden; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public Boolean getHasUnit() { return hasUnit; }
    public void setHasUnit(Boolean hasUnit) { this.hasUnit = hasUnit; }

    public List<String> getUnitOptions() { return unitOptions; }
    public void setUnitOptions(List<String> unitOptions) { this.unitOptions = unitOptions; }

    public String getDefaultUnit() { return defaultUnit; }
    public void setDefaultUnit(String defaultUnit) { this.defaultUnit = defaultUnit; }

    public Boolean getEnable3rdDimension() { return enable3rdDimension; }
    public void setEnable3rdDimension(Boolean enable3rdDimension) { this.enable3rdDimension = enable3rdDimension; }

    public String getThirdDimensionLabel() { return thirdDimensionLabel; }
    public void setThirdDimensionLabel(String thirdDimensionLabel) { this.thirdDimensionLabel = thirdDimensionLabel; }

    public List<String> getCustomDimensions() { return customDimensions; }
    public void setCustomDimensions(List<String> customDimensions) { this.customDimensions = customDimensions; }

    public String getCustomDimensionUnit() { return customDimensionUnit; }
    public void setCustomDimensionUnit(String customDimensionUnit) { this.customDimensionUnit = customDimensionUnit; }

    public String getCustomSizeMode() { return customSizeMode; }
    public void setCustomSizeMode(String customSizeMode) { this.customSizeMode = customSizeMode; }

    public String getDependsOn() { return dependsOn; }
    public void setDependsOn(String dependsOn) { this.dependsOn = dependsOn; }

    public String getDependsOnValue() { return dependsOnValue; }
    public void setDependsOnValue(String dependsOnValue) { this.dependsOnValue = dependsOnValue; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
