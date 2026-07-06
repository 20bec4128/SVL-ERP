package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.EmployeeSalary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import java.util.Optional;

public interface EmployeeSalaryRepository extends JpaRepository<EmployeeSalary, Long> {
    List<EmployeeSalary> findByDeletedFalseOrderByIdDesc();
    Optional<EmployeeSalary> findByEmployeeIdAndDeletedFalse(Long employeeId);
}
