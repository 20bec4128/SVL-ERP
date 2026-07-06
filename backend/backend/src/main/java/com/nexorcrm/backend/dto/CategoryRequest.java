package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(min = 1, max = 120, message = "Category name must be between 1 and 120 characters")
    private String name;

    @NotBlank(message = "Sub category name is required")
    @Size(min = 1, max = 160, message = "Sub category name must be between 1 and 160 characters")
    private String subName;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubName() { return subName; }
    public void setSubName(String subName) { this.subName = subName; }
}
