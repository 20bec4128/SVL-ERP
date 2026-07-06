package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BudgetExpenseRequest {

    @NotBlank(message = "Expense name is required")
    private String name;

    @NotBlank(message = "Category name is required")
    private String category;

    @NotBlank(message = "Sub category name is required")
    private String subCategory;

    @NotNull(message = "Amount is required")
    private Double amount;

    @NotBlank(message = "Expense date is required")
    private String date;

    // Getters and Setters
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
}
