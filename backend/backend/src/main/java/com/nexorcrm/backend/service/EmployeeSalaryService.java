package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.EmployeeSalaryRequest;
import com.nexorcrm.backend.dto.EmployeeSalaryResponse;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.EmployeeSalary;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.EmployeeSalaryRepository;
import com.nexorcrm.backend.repo.ProvidentFundRepository;
import com.nexorcrm.backend.entity.ProvidentFund;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EmployeeSalaryService {

    private final EmployeeSalaryRepository repository;
    private final EmployeeRepository employeeRepository;
    private final ProvidentFundRepository providentFundRepository;

    public EmployeeSalaryService(
            EmployeeSalaryRepository repository,
            EmployeeRepository employeeRepository,
            ProvidentFundRepository providentFundRepository
    ) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.providentFundRepository = providentFundRepository;
    }

    public List<EmployeeSalaryResponse> list() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream().map(this::toResponse).toList();
    }

    public EmployeeSalaryResponse create(EmployeeSalaryRequest request) {
        Employee emp = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        if (Boolean.TRUE.equals(emp.getDeleted())) {
            throw new EntityNotFoundException("Employee not found");
        }

        EmployeeSalary es = new EmployeeSalary();
        es.setEmployee(emp);
        apply(es, request);
        
        // Sync to Employee entity
        syncSalaryToEmployee(emp, request);
        employeeRepository.save(emp);

        // Sync to ProvidentFund settings
        syncToProvidentFund(emp, request.getPf());

        return toResponse(repository.save(es));
    }

    public EmployeeSalaryResponse update(Long id, EmployeeSalaryRequest request) {
        EmployeeSalary es = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee salary record not found"));
        if (Boolean.TRUE.equals(es.getDeleted())) {
            throw new EntityNotFoundException("Employee salary record not found");
        }

        Employee emp = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        if (Boolean.TRUE.equals(emp.getDeleted())) {
            throw new EntityNotFoundException("Employee not found");
        }

        es.setEmployee(emp);
        apply(es, request);
        
        // Sync to Employee entity
        syncSalaryToEmployee(emp, request);
        employeeRepository.save(emp);

        // Sync to ProvidentFund settings
        syncToProvidentFund(emp, request.getPf());

        return toResponse(repository.save(es));
    }

    public void delete(Long id) {
        EmployeeSalary es = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee salary record not found"));
        es.setDeleted(true);
        repository.save(es);
        
        // Reset Employee entity salary details if deleted
        Employee emp = es.getEmployee();
        if (emp != null) {
            emp.setNetSalary(java.math.BigDecimal.ZERO);
            emp.setBasic(java.math.BigDecimal.ZERO);
            emp.setDa(java.math.BigDecimal.ZERO);
            emp.setHra(java.math.BigDecimal.ZERO);
            emp.setConveyance(java.math.BigDecimal.ZERO);
            emp.setTds(java.math.BigDecimal.ZERO);
            emp.setEsi(java.math.BigDecimal.ZERO);
            emp.setPf(java.math.BigDecimal.ZERO);
            emp.setLeaveDeduction(java.math.BigDecimal.ZERO);
            employeeRepository.save(emp);
        }
    }

    private void syncSalaryToEmployee(Employee emp, EmployeeSalaryRequest r) {
        emp.setNetSalary(r.getNetSalary() != null ? r.getNetSalary() : java.math.BigDecimal.ZERO);
        emp.setBasic(r.getBasic() != null ? r.getBasic() : java.math.BigDecimal.ZERO);
        emp.setDa(r.getDa() != null ? r.getDa() : java.math.BigDecimal.ZERO);
        emp.setHra(r.getHra() != null ? r.getHra() : java.math.BigDecimal.ZERO);
        emp.setConveyance(r.getConveyance() != null ? r.getConveyance() : java.math.BigDecimal.ZERO);
        emp.setTds(r.getTds() != null ? r.getTds() : java.math.BigDecimal.ZERO);
        emp.setEsi(r.getEsi() != null ? r.getEsi() : java.math.BigDecimal.ZERO);
        emp.setPf(r.getPf() != null ? r.getPf() : java.math.BigDecimal.ZERO);
        emp.setLeaveDeduction(r.getLeaveDeduction() != null ? r.getLeaveDeduction() : java.math.BigDecimal.ZERO);
    }

    private void apply(EmployeeSalary es, EmployeeSalaryRequest r) {
        es.setNetSalary(r.getNetSalary());
        es.setBasic(r.getBasic());
        es.setDa(r.getDa());
        es.setHra(r.getHra());
        es.setConveyance(r.getConveyance());
        es.setTds(r.getTds());
        es.setEsi(r.getEsi());
        es.setPf(r.getPf());
        es.setLeaveDeduction(r.getLeaveDeduction());
        if (r.getStatus() != null && !r.getStatus().isBlank()) {
            es.setStatus(r.getStatus());
        }
    }

    public EmployeeSalaryResponse toResponse(EmployeeSalary es) {
        EmployeeSalaryResponse r = new EmployeeSalaryResponse();
        r.setId(es.getId());
        r.setNetSalary(es.getNetSalary());
        r.setBasic(es.getBasic());
        r.setDa(es.getDa());
        r.setHra(es.getHra());
        r.setConveyance(es.getConveyance());
        r.setTds(es.getTds());
        r.setEsi(es.getEsi());
        r.setPf(es.getPf());
        r.setLeaveDeduction(es.getLeaveDeduction());
        r.setStatus(es.getStatus());
        r.setCreatedAt(es.getCreatedAt());
        r.setUpdatedAt(es.getUpdatedAt());

        Employee emp = es.getEmployee();
        if (emp != null) {
            r.setEmployeeId(emp.getId());
            r.setEmployeeCode(emp.getEmployeeCode());
            r.setName(emp.getName());
            r.setEmail(emp.getEmail() != null && !emp.getEmail().isBlank() ? emp.getEmail() : (emp.getOfficialEmail() != null && !emp.getOfficialEmail().isBlank() ? emp.getOfficialEmail() : emp.getPersonalEmail()));
            r.setPhone(emp.getPhone() != null && !emp.getPhone().isBlank() ? emp.getPhone() : emp.getPersonalContactNumber());
            r.setDesignation(emp.getDesignation());
            r.setJoinDate(emp.getJoinDate());
            r.setImg(emp.getImg());
        }
        return r;
    }

    private void syncToProvidentFund(Employee emp, java.math.BigDecimal pfAmount) {
        if (emp == null || pfAmount == null) return;
        ProvidentFund pf = providentFundRepository
                .findByEmployeeIdAndDeletedFalse(emp.getId())
                .orElse(null);
        if (pf == null) {
            pf = new ProvidentFund();
            pf.setEmployee(emp);
            pf.setPfType("Employee Provident Fund");
            pf.setEmployeeShareAmount(pfAmount);
            pf.setOrganizationShareAmount(java.math.BigDecimal.ZERO);
            pf.setStatus("Approved");
            pf.setDescription("Automatically created from Employee Salary details");
            providentFundRepository.save(pf);
        } else {
            pf.setEmployeeShareAmount(pfAmount);
            providentFundRepository.save(pf);
        }
    }
}
