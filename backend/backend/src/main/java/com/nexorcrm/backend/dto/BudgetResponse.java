package com.nexorcrm.backend.dto;

import com.nexorcrm.backend.entity.Budget;

import java.time.LocalDateTime;

public class BudgetResponse {
    private Long id;
    private String title;
    private String type;
    private String startDate;
    private String endDate;
    private Double totalRevenue;
    private Double totalExpense;
    private Double taxAmount;
    private Double budgetAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BudgetResponse(Budget entity) {
        this.id = entity.getId();
        this.title = entity.getTitle();
        this.type = entity.getType();
        this.startDate = entity.getStartDate();
        this.endDate = entity.getEndDate();
        this.totalRevenue = entity.getTotalRevenue();
        this.totalExpense = entity.getTotalExpense();
        this.taxAmount = entity.getTaxAmount();
        this.budgetAmount = entity.getBudgetAmount();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public Double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(Double totalRevenue) { this.totalRevenue = totalRevenue; }

    public Double getTotalExpense() { return totalExpense; }
    public void setTotalExpense(Double totalExpense) { this.totalExpense = totalExpense; }

    public Double getTaxAmount() { return taxAmount; }
    public void setTaxAmount(Double taxAmount) { this.taxAmount = taxAmount; }

    public Double getBudgetAmount() { return budgetAmount; }
    public void setBudgetAmount(Double budgetAmount) { this.budgetAmount = budgetAmount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
