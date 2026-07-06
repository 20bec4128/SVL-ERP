package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UserDesignationRequest {

    @NotNull(message = "User Department ID is required")
    private Long userDepartmentId;

    @NotBlank(message = "Designation name is required")
    private String name;

    public Long getUserDepartmentId() {
        return userDepartmentId;
    }

    public void setUserDepartmentId(Long userDepartmentId) {
        this.userDepartmentId = userDepartmentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
