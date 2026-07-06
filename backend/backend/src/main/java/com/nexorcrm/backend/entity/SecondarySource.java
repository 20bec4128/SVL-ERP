package com.nexorcrm.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "secondary_sources")
public class SecondarySource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "secondary_id", nullable = false, unique = true, length = 64)
    private String secondaryId;

    @Column(name = "source_name", nullable = false, unique = true, length = 160)
    private String sourceName;

    @Column(name = "primary_source_id")
    private Long primarySourceId;

    @Column(name = "is_deleted", nullable = false)
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
    public String getSecondaryId() { return secondaryId; }
    public void setSecondaryId(String secondaryId) { this.secondaryId = secondaryId; }
    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }
    public Long getPrimarySourceId() { return primarySourceId; }
    public void setPrimarySourceId(Long primarySourceId) { this.primarySourceId = primarySourceId; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
