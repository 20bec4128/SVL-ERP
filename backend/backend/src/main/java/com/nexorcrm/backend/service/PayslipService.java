package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.PayslipRequest;
import com.nexorcrm.backend.dto.PayslipResponse;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.EmployeeSalary;
import com.nexorcrm.backend.entity.Payslip;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.EmployeeSalaryRepository;
import com.nexorcrm.backend.repo.PayslipRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class PayslipService {

    private final PayslipRepository repository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeSalaryRepository employeeSalaryRepository;

    public PayslipService(PayslipRepository repository,
                          EmployeeRepository employeeRepository,
                          EmployeeSalaryRepository employeeSalaryRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.employeeSalaryRepository = employeeSalaryRepository;
    }

    public List<PayslipResponse> list() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream().map(this::toResponse).toList();
    }

    public PayslipResponse create(PayslipRequest request) {
        Employee emp = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        if (Boolean.TRUE.equals(emp.getDeleted())) {
            throw new EntityNotFoundException("Employee not found");
        }

        EmployeeSalary salary = null;
        if (request.getEmployeeSalaryId() != null) {
            salary = employeeSalaryRepository.findById(request.getEmployeeSalaryId())
                    .orElse(null);
        }

        Payslip p = new Payslip();
        p.setEmployee(emp);
        p.setEmployeeSalary(salary);
        p.setMonth(request.getMonth());

        if (salary != null) {
            p.setNetSalary(salary.getNetSalary());
            p.setBasic(salary.getBasic());
            p.setDa(salary.getDa());
            p.setHra(salary.getHra());
            p.setConveyance(salary.getConveyance());
            p.setTds(salary.getTds());
            p.setEsi(salary.getEsi());
            p.setPf(salary.getPf());
            p.setLeaveDeduction(salary.getLeaveDeduction());
        }

        p.setGeneratedAt(LocalDateTime.now());
        return toResponse(repository.save(p));
    }

    public void delete(Long id) {
        Payslip p = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payslip not found"));
        p.setDeleted(true);
        repository.save(p);
    }

    public PayslipResponse toResponse(Payslip p) {
        PayslipResponse r = new PayslipResponse();
        r.setId(p.getId());
        if (p.getEmployeeSalary() != null) {
            r.setEmployeeSalaryId(p.getEmployeeSalary().getId());
        }
        r.setMonth(p.getMonth());
        r.setNetSalary(p.getNetSalary());
        r.setBasic(p.getBasic());
        r.setDa(p.getDa());
        r.setHra(p.getHra());
        r.setConveyance(p.getConveyance());
        r.setTds(p.getTds());
        r.setEsi(p.getEsi());
        r.setPf(p.getPf());
        r.setLeaveDeduction(p.getLeaveDeduction());
        r.setOvertime(p.getOvertime());
        r.setStatus(p.getStatus());
        r.setGeneratedAt(p.getGeneratedAt());

        Employee emp = p.getEmployee();
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
}
