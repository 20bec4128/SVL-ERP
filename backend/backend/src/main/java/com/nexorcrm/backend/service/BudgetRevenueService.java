package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.BudgetRevenueRequest;
import com.nexorcrm.backend.dto.BudgetRevenueResponse;
import com.nexorcrm.backend.entity.BudgetRevenue;
import com.nexorcrm.backend.repo.BudgetRevenueRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BudgetRevenueService {

    private final BudgetRevenueRepository repository;

    public BudgetRevenueService(BudgetRevenueRepository repository) {
        this.repository = repository;
    }

    public List<BudgetRevenueResponse> list() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream()
                .map(BudgetRevenueResponse::new)
                .toList();
    }

    public BudgetRevenueResponse create(BudgetRevenueRequest request) {
        BudgetRevenue revenue = new BudgetRevenue();
        copyProperties(request, revenue);
        return new BudgetRevenueResponse(repository.save(revenue));
    }

    public BudgetRevenueResponse update(Long id, BudgetRevenueRequest request) {
        BudgetRevenue revenue = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Revenue not found"));
        if (Boolean.TRUE.equals(revenue.getDeleted())) {
            throw new EntityNotFoundException("Revenue not found");
        }
        copyProperties(request, revenue);
        return new BudgetRevenueResponse(repository.save(revenue));
    }

    public void delete(Long id) {
        BudgetRevenue revenue = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Revenue not found"));
        if (Boolean.TRUE.equals(revenue.getDeleted())) {
            return;
        }
        revenue.setDeleted(true);
        repository.save(revenue);
    }

    private void copyProperties(BudgetRevenueRequest request, BudgetRevenue revenue) {
        revenue.setName(request.getName().trim());
        revenue.setCategory(request.getCategory().trim());
        revenue.setSubCategory(request.getSubCategory().trim());
        revenue.setAmount(request.getAmount());
        revenue.setDate(request.getDate().trim());
    }
}
