package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.ProvidentFundRequest;
import com.nexorcrm.backend.dto.ProvidentFundResponse;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.ProvidentFund;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.ProvidentFundRepository;
import com.nexorcrm.backend.repo.EmployeeSalaryRepository;
import com.nexorcrm.backend.entity.EmployeeSalary;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.math.BigDecimal;

@Service
@Transactional
public class ProvidentFundService {

    private final ProvidentFundRepository repository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;

    public ProvidentFundService(
            ProvidentFundRepository repository,
            EmployeeRepository employeeRepository,
            EmployeeSalaryRepository employeeSalaryRepository
    ) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.employeeSalaryRepository = employeeSalaryRepository;
    }

    public List<ProvidentFundResponse> list() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream().map(this::toResponse).toList();
    }

    public ProvidentFundResponse create(ProvidentFundRequest request) {
        Employee emp = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        if (Boolean.TRUE.equals(emp.getDeleted())) {
            throw new EntityNotFoundException("Employee not found");
        }

        ProvidentFund pf = new ProvidentFund();
        pf.setEmployee(emp);
        apply(pf, request);
        ProvidentFund saved = repository.save(pf);

        if ("Approved".equalsIgnoreCase(saved.getStatus())) {
            syncPfToEmployeeAndSalary(emp, saved.getEmployeeShareAmount());
        } else {
            syncPfToEmployeeAndSalary(emp, BigDecimal.ZERO);
        }

        return toResponse(saved);
    }

    public ProvidentFundResponse update(Long id, ProvidentFundRequest request) {
        ProvidentFund pf = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Provident fund record not found"));
        if (Boolean.TRUE.equals(pf.getDeleted())) {
            throw new EntityNotFoundException("Provident fund record not found");
        }

        Employee emp = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        if (Boolean.TRUE.equals(emp.getDeleted())) {
            throw new EntityNotFoundException("Employee not found");
        }

        pf.setEmployee(emp);
        apply(pf, request);
        ProvidentFund saved = repository.save(pf);

        if ("Approved".equalsIgnoreCase(saved.getStatus())) {
            syncPfToEmployeeAndSalary(emp, saved.getEmployeeShareAmount());
        } else {
            syncPfToEmployeeAndSalary(emp, BigDecimal.ZERO);
        }

        return toResponse(saved);
    }

    public void delete(Long id) {
        ProvidentFund pf = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Provident fund record not found"));
        pf.setDeleted(true);
        repository.save(pf);

        Employee emp = pf.getEmployee();
        if (emp != null) {
            syncPfToEmployeeAndSalary(emp, BigDecimal.ZERO);
        }
    }

    private void apply(ProvidentFund pf, ProvidentFundRequest r) {
        pf.setPfType(r.getPfType());
        pf.setEmployeeShareAmount(r.getEmployeeShareAmount());
        pf.setOrganizationShareAmount(r.getOrganizationShareAmount());
        pf.setDescription(r.getDescription());
        if (r.getStatus() != null && !r.getStatus().isBlank()) {
            pf.setStatus(r.getStatus());
        }
    }

    public ProvidentFundResponse toResponse(ProvidentFund pf) {
        ProvidentFundResponse r = new ProvidentFundResponse();
        r.setId(pf.getId());
        r.setPfType(pf.getPfType());
        r.setEmployeeShareAmount(pf.getEmployeeShareAmount());
        r.setOrganizationShareAmount(pf.getOrganizationShareAmount());
        r.setDescription(pf.getDescription());
        r.setStatus(pf.getStatus());
        r.setCreatedAt(pf.getCreatedAt());
        r.setUpdatedAt(pf.getUpdatedAt());

        Employee emp = pf.getEmployee();
        if (emp != null) {
            r.setEmployeeId(emp.getId());
            r.setEmployeeCode(emp.getEmployeeCode());
            r.setName(emp.getName());
            r.setEmail(emp.getEmail() != null && !emp.getEmail().isBlank() ? emp.getEmail() : (emp.getOfficialEmail() != null && !emp.getOfficialEmail().isBlank() ? emp.getOfficialEmail() : emp.getPersonalEmail()));
            r.setPhone(emp.getPhone() != null && !emp.getPhone().isBlank() ? emp.getPhone() : emp.getPersonalContactNumber());
            r.setDesignation(emp.getDesignation());
            r.setJoinDate(emp.getJoinDate());
        }
        return r;
    }

    private void syncPfToEmployeeAndSalary(Employee emp, BigDecimal pfAmount) {
        if (emp == null) return;
        BigDecimal finalPf = pfAmount == null ? BigDecimal.ZERO : pfAmount;

        emp.setPf(finalPf);
        BigDecimal additions = getOrZero(emp.getBasic())
                .add(getOrZero(emp.getDa()))
                .add(getOrZero(emp.getHra()))
                .add(getOrZero(emp.getConveyance()));
        BigDecimal deductions = getOrZero(emp.getTds())
                .add(getOrZero(emp.getEsi()))
                .add(finalPf)
                .add(getOrZero(emp.getLeaveDeduction()));
        emp.setNetSalary(additions.subtract(deductions).max(BigDecimal.ZERO));
        employeeRepository.save(emp);

        // Also update the EmployeeSalary record if present
        employeeSalaryRepository.findByEmployeeIdAndDeletedFalse(emp.getId()).ifPresent(es -> {
            es.setPf(finalPf);
            es.setNetSalary(additions.subtract(deductions).max(BigDecimal.ZERO));
            employeeSalaryRepository.save(es);
        });
    }

    private static BigDecimal getOrZero(BigDecimal val) {
        return val == null ? BigDecimal.ZERO : val;
    }
}
