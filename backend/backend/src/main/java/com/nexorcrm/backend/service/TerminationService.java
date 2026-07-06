package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.TerminationRequest;
import com.nexorcrm.backend.dto.TerminationResponse;
import com.nexorcrm.backend.entity.Termination;
import com.nexorcrm.backend.repo.TerminationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TerminationService {

    private final TerminationRepository terminationRepository;
    private final com.nexorcrm.backend.repo.EmployeeRepository employeeRepository;

    public TerminationService(TerminationRepository terminationRepository,
                              com.nexorcrm.backend.repo.EmployeeRepository employeeRepository) {
        this.terminationRepository = terminationRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<TerminationResponse> list() {
        return terminationRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public TerminationResponse create(TerminationRequest request) {
        Termination row = new Termination();
        apply(row, request);
        return toResponse(terminationRepository.save(row));
    }

    public TerminationResponse update(Long id, TerminationRequest request) {
        Termination row = terminationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Termination not found"));
        apply(row, request);
        return toResponse(terminationRepository.save(row));
    }

    public void delete(Long id) {
        Termination row = terminationRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Termination not found"));
        row.setDeleted(true);
        terminationRepository.save(row);
    }

    private void apply(Termination row, TerminationRequest request) {
        var employee = request.getEmployeeId() == null
                ? Optional.<com.nexorcrm.backend.entity.Employee>empty()
                : employeeRepository.findById(request.getEmployeeId());
        String department = firstNonBlank(
                request.getDepartment(),
                employee.map(com.nexorcrm.backend.entity.Employee::getDepartmentName).orElse(null),
                employee.map(com.nexorcrm.backend.entity.Employee::getDept).orElse(null)
        );
        row.setEmployeeId(request.getEmployeeId());
        row.setEmployeeName(request.getEmployeeName().trim());
        row.setDepartment(department);
        row.setTerminationType(request.getTerminationType().trim());
        row.setNoticeDate(request.getNoticeDate());
        row.setReason(request.getReason().trim());
        row.setTerminationDate(request.getTerminationDate());
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                return value.trim();
            }
        }
        return "";
    }

    private TerminationResponse toResponse(Termination row) {
        TerminationResponse res = new TerminationResponse();
        res.setId(row.getId());
        res.setEmployeeId(row.getEmployeeId());
        res.setEmployeeName(row.getEmployeeName());
        res.setDepartment(row.getDepartment());
        res.setTerminationType(row.getTerminationType());
        res.setNoticeDate(row.getNoticeDate());
        res.setReason(row.getReason());
        res.setTerminationDate(row.getTerminationDate());
        res.setCreatedDate(row.getCreatedAt());
        return res;
    }
}
