package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class ProductFieldConfigRequest {

    private String fieldKey;

    @NotBlank(message = "Label is required")
    private String label;

    @NotBlank(message = "Field type is required")
    private String fieldType;

    private List<String> options;

    @NotNull(message = "Required flag must be specified")
    private Boolean isRequired;

    private String placeholder;
    
    private Boolean allowCustom;
    
    private Boolean isHidden;
    
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
}
