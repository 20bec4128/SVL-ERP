package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "custom_field_options",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_custom_field_option",
        columnNames = {"type_id", "subtype_id", "field_key", "value_norm"}
    )
)
public class CustomFieldOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "type_id", nullable = false)
    private Long typeId;

    @Column(name = "subtype_id")
    private Long subtypeId;

    @Column(name = "field_key", nullable = false, length = 100)
    private String fieldKey;

    @Column(name = "value_raw", nullable = false, length = 500)
    private String valueRaw;

    @Column(name = "value_norm", nullable = false, length = 500)
    private String valueNorm;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getTypeId() { return typeId; }
    public void setTypeId(Long typeId) { this.typeId = typeId; }
    public Long getSubtypeId() { return subtypeId; }
    public void setSubtypeId(Long subtypeId) { this.subtypeId = subtypeId; }
    public String getFieldKey() { return fieldKey; }
    public void setFieldKey(String fieldKey) { this.fieldKey = fieldKey; }
    public String getValueRaw() { return valueRaw; }
    public void setValueRaw(String valueRaw) { this.valueRaw = valueRaw; }
    public String getValueNorm() { return valueNorm; }
    public void setValueNorm(String valueNorm) { this.valueNorm = valueNorm; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
