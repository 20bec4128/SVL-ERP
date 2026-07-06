package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.BudgetExpense;

import java.time.LocalDateTime;

public class BudgetExpenseResponse {
    private Long id;
    private String name;
    private String category;
    private String subCategory;
    private Double amount;
    private String date;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BudgetExpenseResponse(BudgetExpense entity) {
        this.id = entity.getId();
        this.name = entity.getName();
        this.category = entity.getCategory();
        this.subCategory = entity.getSubCategory();
        this.amount = entity.getAmount();
        this.date = entity.getDate();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String subCategory) { this.subCategory = subCategory; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
