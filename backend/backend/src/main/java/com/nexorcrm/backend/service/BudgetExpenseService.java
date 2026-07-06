package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.BudgetExpenseRequest;
import com.nexorcrm.backend.dto.BudgetExpenseResponse;
import com.nexorcrm.backend.entity.BudgetExpense;
import com.nexorcrm.backend.repo.BudgetExpenseRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BudgetExpenseService {

    private final BudgetExpenseRepository repository;

    public BudgetExpenseService(BudgetExpenseRepository repository) {
        this.repository = repository;
    }

    public List<BudgetExpenseResponse> list() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream()
                .map(BudgetExpenseResponse::new)
                .toList();
    }

    public BudgetExpenseResponse create(BudgetExpenseRequest request) {
        BudgetExpense expense = new BudgetExpense();
        copyProperties(request, expense);
        return new BudgetExpenseResponse(repository.save(expense));
    }

    public BudgetExpenseResponse update(Long id, BudgetExpenseRequest request) {
        BudgetExpense expense = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense not found"));
        if (Boolean.TRUE.equals(expense.getDeleted())) {
            throw new EntityNotFoundException("Expense not found");
        }
        copyProperties(request, expense);
        return new BudgetExpenseResponse(repository.save(expense));
    }

    public void delete(Long id) {
        BudgetExpense expense = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense not found"));
        if (Boolean.TRUE.equals(expense.getDeleted())) {
            return;
        }
        expense.setDeleted(true);
        repository.save(expense);
    }

    private void copyProperties(BudgetExpenseRequest request, BudgetExpense expense) {
        expense.setName(request.getName().trim());
        expense.setCategory(request.getCategory().trim());
        expense.setSubCategory(request.getSubCategory().trim());
        expense.setAmount(request.getAmount());
        expense.setDate(request.getDate().trim());
    }
}
