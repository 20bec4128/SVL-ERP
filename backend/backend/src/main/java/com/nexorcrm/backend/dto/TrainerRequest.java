package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TrainerRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 120)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 120)
    private String lastName;

    @Size(max = 160)
    private String role;

    @Size(max = 40)
    private String phone;

    @Size(max = 160)
    private String email;

    @Size(max = 500)
    private String description;

    private String status; // Active / Inactive

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
