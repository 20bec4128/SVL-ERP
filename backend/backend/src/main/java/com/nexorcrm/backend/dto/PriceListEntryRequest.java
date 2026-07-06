package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotNull;

public class PriceListEntryRequest {
    private Long categoryId;

    @NotNull(message = "Type ID is required")
    private Long typeId;

    private Long subtypeId;

    private String typeName;

    private String subtypeName;

    private String variantFields;

    @NotNull(message = "Quantity slabs is required")
    private String quantitySlabs;

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public Long getTypeId() { return typeId; }
    public void setTypeId(Long typeId) { this.typeId = typeId; }

    public Long getSubtypeId() { return subtypeId; }
    public void setSubtypeId(Long subtypeId) { this.subtypeId = subtypeId; }

    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }

    public String getSubtypeName() { return subtypeName; }
    public void setSubtypeName(String subtypeName) { this.subtypeName = subtypeName; }

    public String getVariantFields() { return variantFields; }
    public void setVariantFields(String variantFields) { this.variantFields = variantFields; }

    public String getQuantitySlabs() { return quantitySlabs; }
    public void setQuantitySlabs(String quantitySlabs) { this.quantitySlabs = quantitySlabs; }
}
