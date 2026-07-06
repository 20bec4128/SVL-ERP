package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.ProductFieldConfig;
import java.time.LocalDateTime;
import java.util.List;

public class ProductFieldConfigResponse {

    private Long id;
    private Long serviceTypeId;
    private String fieldKey;
    private String label;
    private String fieldType;
    private List<String> options;
    private Boolean isRequired;
    private String placeholder;
    private Boolean allowCustom;
    private Boolean isHidden;
    private Integer displayOrder;
    private Boolean hasUnit;
    private List<String> unitOptions;
    private String defaultUnit;
    private Boolean enable3rdDimension;
    private String thirdDimensionLabel;
    private List<String> customDimensions;
    private String customDimensionUnit;
    private String customSizeMode;
    private String dependsOn;
    private String dependsOnValue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ProductFieldConfigResponse(ProductFieldConfig config) {
        this.id = config.getId();
        this.serviceTypeId = config.getServiceType() != null ? config.getServiceType().getId() : null;
        this.fieldKey = config.getFieldKey();
        this.label = config.getLabel();
        this.fieldType = config.getFieldType();
        this.options = config.getOptions();
        this.isRequired = config.getIsRequired();
        this.placeholder = config.getPlaceholder();
        this.allowCustom = config.getAllowCustom();
        this.isHidden = config.getIsHidden();
        this.displayOrder = config.getDisplayOrder();
        this.hasUnit = config.getHasUnit();
        this.unitOptions = config.getUnitOptions();
        this.defaultUnit = config.getDefaultUnit();
        this.enable3rdDimension = config.getEnable3rdDimension();
        this.thirdDimensionLabel = config.getThirdDimensionLabel();
        this.customDimensions = config.getCustomDimensions();
        this.customDimensionUnit = config.getCustomDimensionUnit();
        this.customSizeMode = config.getCustomSizeMode();
        this.dependsOn = config.getDependsOn();
        this.dependsOnValue = config.getDependsOnValue();
        this.createdAt = config.getCreatedAt();
        this.updatedAt = config.getUpdatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getServiceTypeId() { return serviceTypeId; }
    public void setServiceTypeId(Long serviceTypeId) { this.serviceTypeId = serviceTypeId; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
