package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class TicketCategoryRequest {

    @NotBlank
    private String name;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
