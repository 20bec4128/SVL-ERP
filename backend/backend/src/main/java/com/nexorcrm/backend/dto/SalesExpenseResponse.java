package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.SalesExpense;

import java.time.LocalDateTime;

public class SalesExpenseResponse {
    private Long id;
    private String name;
    private String date;
    private String method;
    private Double amount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SalesExpenseResponse(SalesExpense entity) {
        this.id = entity.getId();
        this.name = entity.getName();
        this.date = entity.getDate();
        this.method = entity.getMethod();
        this.amount = entity.getAmount();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
