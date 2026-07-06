package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.BudgetRequest;
import com.nexorcrm.backend.dto.BudgetResponse;
import com.nexorcrm.backend.entity.Budget;
import com.nexorcrm.backend.repo.BudgetRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BudgetService {

    private final BudgetRepository repository;

    public BudgetService(BudgetRepository repository) {
        this.repository = repository;
    }

    public List<BudgetResponse> list() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream()
                .map(BudgetResponse::new)
                .toList();
    }

    public BudgetResponse create(BudgetRequest request) {
        Budget budget = new Budget();
        copyProperties(request, budget);
        return new BudgetResponse(repository.save(budget));
    }

    public BudgetResponse update(Long id, BudgetRequest request) {
        Budget budget = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Budget not found"));
        if (Boolean.TRUE.equals(budget.getDeleted())) {
            throw new EntityNotFoundException("Budget not found");
        }
        copyProperties(request, budget);
        return new BudgetResponse(repository.save(budget));
    }

    public void delete(Long id) {
        Budget budget = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Budget not found"));
        if (Boolean.TRUE.equals(budget.getDeleted())) {
            return;
        }
        budget.setDeleted(true);
        repository.save(budget);
    }

    private void copyProperties(BudgetRequest request, Budget budget) {
        budget.setTitle(request.getTitle().trim());
        budget.setType(request.getType().trim());
        budget.setStartDate(request.getStartDate().trim());
        budget.setEndDate(request.getEndDate().trim());
        budget.setTotalRevenue(request.getTotalRevenue());
        budget.setTotalExpense(request.getTotalExpense());
        budget.setTaxAmount(request.getTaxAmount());
        budget.setBudgetAmount(request.getBudgetAmount());
    }
}
