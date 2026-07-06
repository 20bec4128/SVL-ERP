package com.nexorcrm.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_category")
public class StockCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    // JSON string describing dynamic fields
    @Lob
    @Column(name = "fields", columnDefinition = "text")
    private String fields;

    // JSON array of allowed vendor_type ids
    @Lob
    @Column(name = "allowed_vendor_type_ids", columnDefinition = "text")
    private String allowedVendorTypeIds;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

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
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getFields() { return fields; }
    public void setFields(String fields) { this.fields = fields; }
    public String getAllowedVendorTypeIds() { return allowedVendorTypeIds; }
    public void setAllowedVendorTypeIds(String allowedVendorTypeIds) { this.allowedVendorTypeIds = allowedVendorTypeIds; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
