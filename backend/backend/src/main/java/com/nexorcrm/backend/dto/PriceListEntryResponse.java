package com.nexorcrm.backend.dto;

public class PriceListEntryResponse {
    private Long id;

    private Long categoryId;

    private Long typeId;

    private Long subtypeId;

    private String typeName;

    private String subtypeName;

    private String variantFields;

    private String quantitySlabs;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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
