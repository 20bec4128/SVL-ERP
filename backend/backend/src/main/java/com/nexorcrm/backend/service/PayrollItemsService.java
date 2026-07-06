package com.nexorcrm.backend.service;

import com.nexorcrm.backend.entity.PayrollAddition;
import com.nexorcrm.backend.entity.PayrollDeduction;
import com.nexorcrm.backend.entity.PayrollOvertime;
import com.nexorcrm.backend.repo.PayrollAdditionRepository;
import com.nexorcrm.backend.repo.PayrollDeductionRepository;
import com.nexorcrm.backend.repo.PayrollOvertimeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PayrollItemsService {

    private final PayrollAdditionRepository additionRepository;
    private final PayrollOvertimeRepository overtimeRepository;
    private final PayrollDeductionRepository deductionRepository;

    public PayrollItemsService(PayrollAdditionRepository additionRepository,
                               PayrollOvertimeRepository overtimeRepository,
                               PayrollDeductionRepository deductionRepository) {
        this.additionRepository = additionRepository;
        this.overtimeRepository = overtimeRepository;
        this.deductionRepository = deductionRepository;
    }

    // Additions CRUD
    public List<PayrollAddition> listAdditions() {
        return additionRepository.findByDeletedFalseOrderByNameAsc();
    }

    public PayrollAddition createAddition(PayrollAddition addition) {
        return additionRepository.save(addition);
    }

    public PayrollAddition updateAddition(Long id, PayrollAddition source) {
        PayrollAddition existing = additionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Addition not found"));
        if (Boolean.TRUE.equals(existing.getDeleted())) {
            throw new EntityNotFoundException("Addition not found");
        }
        existing.setName(source.getName());
        existing.setCategory(source.getCategory());
        existing.setUnitCalculation(source.getUnitCalculation());
        existing.setStatus(source.getStatus());
        return additionRepository.save(existing);
    }

    public void deleteAddition(Long id) {
        PayrollAddition existing = additionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Addition not found"));
        existing.setDeleted(true);
        additionRepository.save(existing);
    }

    // Overtimes CRUD
    public List<PayrollOvertime> listOvertimes() {
        return overtimeRepository.findByDeletedFalseOrderByNameAsc();
    }

    public PayrollOvertime createOvertime(PayrollOvertime overtime) {
        return overtimeRepository.save(overtime);
    }

    public PayrollOvertime updateOvertime(Long id, PayrollOvertime source) {
        PayrollOvertime existing = overtimeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Overtime not found"));
        if (Boolean.TRUE.equals(existing.getDeleted())) {
            throw new EntityNotFoundException("Overtime not found");
        }
        existing.setName(source.getName());
        existing.setRateType(source.getRateType());
        existing.setRate(source.getRate());
        return overtimeRepository.save(existing);
    }

    public void deleteOvertime(Long id) {
        PayrollOvertime existing = overtimeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Overtime not found"));
        existing.setDeleted(true);
        overtimeRepository.save(existing);
    }

    // Deductions CRUD
    public List<PayrollDeduction> listDeductions() {
        return deductionRepository.findByDeletedFalseOrderByNameAsc();
    }

    public PayrollDeduction createDeduction(PayrollDeduction deduction) {
        return deductionRepository.save(deduction);
    }

    public PayrollDeduction updateDeduction(Long id, PayrollDeduction source) {
        PayrollDeduction existing = deductionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Deduction not found"));
        if (Boolean.TRUE.equals(existing.getDeleted())) {
            throw new EntityNotFoundException("Deduction not found");
        }
        existing.setName(source.getName());
        existing.setUnitCalculation(source.getUnitCalculation());
        existing.setStatus(source.getStatus());
        return deductionRepository.save(existing);
    }

    public void deleteDeduction(Long id) {
        PayrollDeduction existing = deductionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Deduction not found"));
        existing.setDeleted(true);
        deductionRepository.save(existing);
    }
}
