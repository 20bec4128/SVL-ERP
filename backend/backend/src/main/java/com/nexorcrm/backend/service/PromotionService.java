package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.PromotionRequest;
import com.nexorcrm.backend.dto.PromotionResponse;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.Promotion;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.PromotionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PromotionService {

    private final PromotionRepository repository;
    private final EmployeeRepository employeeRepository;

    public PromotionService(PromotionRepository repository, EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
    }

    public List<PromotionResponse> list() {
        return repository.findByDeletedFalseOrderByPromotionDateDesc()
                .stream().map(this::toResponse).toList();
    }

    public PromotionResponse create(PromotionRequest request) {
        Promotion p = new Promotion();
        apply(p, request);
        p = repository.save(p);
        applyIfDue(p);
        return toResponse(p);
    }

    public PromotionResponse update(Long id, PromotionRequest request) {
        Promotion p = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Promotion not found"));
        if (Boolean.TRUE.equals(p.getDeleted())) {
            throw new EntityNotFoundException("Promotion not found");
        }
        apply(p, request);
        p = repository.save(p);
        applyIfDue(p);
        return toResponse(p);
    }

    public void delete(Long id) {
        Promotion p = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Promotion not found"));
        p.setDeleted(true);
        repository.save(p);
    }

    public void applyDuePromotions() {
        List<Promotion> due = repository.findByDeletedFalseAndAppliedFalseAndPromotionDateLessThanEqual(LocalDate.now());
        for (Promotion p : due) {
            applyIfDue(p);
        }
    }

    private void apply(Promotion p, PromotionRequest r) {
        p.setEmployeeId(r.getEmployeeId());
        p.setEmployeeName(r.getEmployeeName());
        p.setDepartment(r.getDepartment());
        p.setDesignationFrom(r.getDesignationFrom());
        p.setDesignationTo(r.getDesignationTo());
        p.setPromotionDate(r.getPromotionDate());
    }

    private void applyIfDue(Promotion p) {
        if (p.getPromotionDate() == null) return;
        if (Boolean.TRUE.equals(p.getApplied())) return;
        if (p.getPromotionDate().isAfter(LocalDate.now())) return;

        Employee employee = null;
        if (p.getEmployeeId() != null) {
            employee = employeeRepository.findById(p.getEmployeeId()).orElse(null);
        }
        if (employee == null && p.getEmployeeName() != null && !p.getEmployeeName().isBlank()) {
            employee = employeeRepository.findFirstByNameIgnoreCaseAndDeletedFalse(p.getEmployeeName());
            if (employee != null) {
                p.setEmployeeId(employee.getId());
            }
        }
        if (employee == null) {
            return;
        }
        if (p.getDepartment() != null && !p.getDepartment().isBlank()) {
            employee.setDept(p.getDepartment().trim());
        }
        if (p.getDesignationTo() != null && !p.getDesignationTo().isBlank()) {
            employee.setDesignation(p.getDesignationTo().trim());
        }
        employeeRepository.save(employee);

        p.setApplied(true);
        p.setAppliedAt(LocalDateTime.now());
        repository.save(p);
    }

    private PromotionResponse toResponse(Promotion p) {
        PromotionResponse r = new PromotionResponse();
        r.setId(p.getId());
        r.setEmployeeId(p.getEmployeeId());
        r.setEmployeeName(p.getEmployeeName());
        r.setDepartment(p.getDepartment());
        r.setDesignationFrom(p.getDesignationFrom());
        r.setDesignationTo(p.getDesignationTo());
        r.setPromotionDate(p.getPromotionDate());
        return r;
    }
}
