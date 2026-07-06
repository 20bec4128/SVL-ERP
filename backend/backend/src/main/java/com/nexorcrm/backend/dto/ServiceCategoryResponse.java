package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.ServiceCategory;

public class ServiceCategoryResponse {

    private Long id;
    private String name;
    private Boolean isActive;

    public ServiceCategoryResponse(ServiceCategory entity) {
        this.id = entity.getId();
        this.name = entity.getName();
        this.isActive = entity.getIsActive();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
