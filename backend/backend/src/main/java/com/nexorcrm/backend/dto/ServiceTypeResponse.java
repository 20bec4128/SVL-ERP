package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.ServiceType;

public class ServiceTypeResponse {

    private Long id;
    private String name;
    private String fieldConfigKey;
    private Long categoryId;
    private String categoryName;
    private Long parentId;
    private String parentName;

    public ServiceTypeResponse(ServiceType serviceType) {
        this.id = serviceType.getId();
        this.name = serviceType.getName();
        this.fieldConfigKey = serviceType.getFieldConfigKey();
        this.categoryId = serviceType.getCategory().getId();
        this.categoryName = serviceType.getCategory().getName();
        if (serviceType.getParent() != null) {
            this.parentId = serviceType.getParent().getId();
            this.parentName = serviceType.getParent().getName();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFieldConfigKey() {
        return fieldConfigKey;
    }

    public void setFieldConfigKey(String fieldConfigKey) {
        this.fieldConfigKey = fieldConfigKey;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public String getParentName() {
        return parentName;
    }

    public void setParentName(String parentName) {
        this.parentName = parentName;
    }
}
