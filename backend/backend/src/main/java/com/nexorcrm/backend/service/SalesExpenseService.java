package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.SalesExpenseRequest;
import com.nexorcrm.backend.dto.SalesExpenseResponse;
import com.nexorcrm.backend.entity.SalesExpense;
import com.nexorcrm.backend.repo.SalesExpenseRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SalesExpenseService {

    private final SalesExpenseRepository repository;

    public SalesExpenseService(SalesExpenseRepository repository) {
        this.repository = repository;
    }

    public List<SalesExpenseResponse> list() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream()
                .map(SalesExpenseResponse::new)
                .toList();
    }

    public SalesExpenseResponse create(SalesExpenseRequest request) {
        SalesExpense expense = new SalesExpense();
        copyProperties(request, expense);
        return new SalesExpenseResponse(repository.save(expense));
    }

    public SalesExpenseResponse update(Long id, SalesExpenseRequest request) {
        SalesExpense expense = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense not found"));
        if (Boolean.TRUE.equals(expense.getDeleted())) {
            throw new EntityNotFoundException("Expense not found");
        }
        copyProperties(request, expense);
        return new SalesExpenseResponse(repository.save(expense));
    }

    public void delete(Long id) {
        SalesExpense expense = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Expense not found"));
        if (Boolean.TRUE.equals(expense.getDeleted())) {
            return;
        }
        expense.setDeleted(true);
        repository.save(expense);
    }

    private void copyProperties(SalesExpenseRequest request, SalesExpense expense) {
        expense.setName(request.getName().trim());
        expense.setDate(request.getDate().trim());
        expense.setMethod(request.getMethod().trim());
        expense.setAmount(request.getAmount());
    }
}
