package com.nexorcrm.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexorcrm.backend.dto.PerformanceAppraisalCompetency;
import com.nexorcrm.backend.dto.PerformanceAppraisalRequest;
import com.nexorcrm.backend.dto.PerformanceAppraisalResponse;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.PerformanceAppraisal;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.PerformanceAppraisalRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class PerformanceAppraisalService {

    private final PerformanceAppraisalRepository repository;
    private final EmployeeRepository employeeRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PerformanceAppraisalService(PerformanceAppraisalRepository repository, EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
    }

    public List<PerformanceAppraisalResponse> listAll() {
        return repository.findByDeletedFalseOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    public PerformanceAppraisalResponse create(PerformanceAppraisalRequest request) {
        PerformanceAppraisal appraisal = new PerformanceAppraisal();
        applyRequest(appraisal, request);
        PerformanceAppraisal saved = repository.save(appraisal);
        return toResponse(saved);
    }

    public PerformanceAppraisalResponse update(Long id, PerformanceAppraisalRequest request) {
        PerformanceAppraisal appraisal = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Performance appraisal not found"));
        if (Boolean.TRUE.equals(appraisal.getDeleted())) {
            throw new EntityNotFoundException("Performance appraisal not found");
        }
        applyRequest(appraisal, request);
        PerformanceAppraisal saved = repository.save(appraisal);
        return toResponse(saved);
    }

    public void delete(Long id) {
        PerformanceAppraisal appraisal = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Performance appraisal not found"));
        appraisal.setDeleted(true);
        repository.save(appraisal);
    }

    private void applyRequest(PerformanceAppraisal appraisal, PerformanceAppraisalRequest request) {
        if (request.getEmployeeId() == null) {
            throw new IllegalArgumentException("Employee is required");
        }
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));

        appraisal.setEmployeeId(employee.getId());
        appraisal.setAppraisalDate(request.getAppraisalDate());
        appraisal.setStatus(request.getStatus() != null ? request.getStatus().trim() : "ACTIVE");

        appraisal.setTechnicalJson(writeJson(request.getTechnicalCompetencies()));
        appraisal.setOrganizationalJson(writeJson(request.getOrganizationalCompetencies()));
    }

    private String writeJson(List<PerformanceAppraisalCompetency> list) {
        try {
            if (list == null) return "[]";
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<PerformanceAppraisalCompetency> readJson(String json) {
        try {
            if (json == null || json.isBlank()) return Collections.emptyList();
            return objectMapper.readValue(json, new TypeReference<List<PerformanceAppraisalCompetency>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private PerformanceAppraisalResponse toResponse(PerformanceAppraisal appraisal) {
        PerformanceAppraisalResponse r = new PerformanceAppraisalResponse();
        r.setId(appraisal.getId());
        r.setEmployeeId(appraisal.getEmployeeId());
        r.setAppraisalDate(appraisal.getAppraisalDate());
        r.setStatus(appraisal.getStatus());

        employeeRepository.findById(appraisal.getEmployeeId()).ifPresent(emp -> {
            r.setEmployeeName(emp.getName());
            r.setDepartment(emp.getDept());
            r.setDesignation(emp.getDesignation());
        });

        r.setTechnicalCompetencies(readJson(appraisal.getTechnicalJson()));
        r.setOrganizationalCompetencies(readJson(appraisal.getOrganizationalJson()));
        return r;
    }
}
