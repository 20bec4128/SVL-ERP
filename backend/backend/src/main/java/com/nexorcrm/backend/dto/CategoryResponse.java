package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.AccountingCategory;

import java.time.LocalDateTime;

public class CategoryResponse {

    private Long id;
    private String name;
    private String subName;
    private LocalDateTime createdAt;

    public CategoryResponse(AccountingCategory entity) {
        this.id = entity.getId();
        this.name = entity.getName();
        this.subName = entity.getSubName();
        this.createdAt = entity.getCreatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubName() { return subName; }
    public void setSubName(String subName) { this.subName = subName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
