package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class VendorTypeRequest {
    @NotBlank
    private String typeName;

    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }
}
