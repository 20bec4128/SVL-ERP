package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_list_entry")
public class PriceListEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "type_id", nullable = false)
    private Long typeId;

    @Column(name = "subtype_id")
    private Long subtypeId;

    @Column(name = "type_name")
    private String typeName;

    @Column(name = "subtype_name")
    private String subtypeName;

    @Lob
    @Column(name = "variant_fields", columnDefinition = "text")
    private String variantFields;

    @Lob
    @Column(name = "quantity_slabs", columnDefinition = "text", nullable = false)
    private String quantitySlabs;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
