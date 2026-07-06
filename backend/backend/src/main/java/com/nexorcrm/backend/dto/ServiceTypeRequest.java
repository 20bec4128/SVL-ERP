package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ServiceTypeRequest {

    @NotBlank(message = "Service type name is required")
    @Size(min = 1, max = 255, message = "Service type name must be between 1 and 255 characters")
    private String name;

    @NotBlank(message = "Field config key is required")
    @Size(max = 120, message = "Field config key must be at most 120 characters")
    @Pattern(
        regexp = "^[a-z0-9]+(?:[_-][a-z0-9]+)*$",
        message = "Field config key must use lowercase letters, numbers, underscores, or hyphens"
    )
    private String fieldConfigKey;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private Long parentId;

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

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }
}
