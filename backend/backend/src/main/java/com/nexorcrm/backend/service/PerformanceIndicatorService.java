package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.PerformanceIndicatorRequest;
import com.nexorcrm.backend.dto.PerformanceIndicatorResponse;
import com.nexorcrm.backend.entity.DepartmentMaster;
import com.nexorcrm.backend.entity.DesignationMaster;
import com.nexorcrm.backend.entity.PerformanceIndicator;
import com.nexorcrm.backend.repo.DepartmentMasterRepository;
import com.nexorcrm.backend.repo.DesignationMasterRepository;
import com.nexorcrm.backend.repo.PerformanceIndicatorRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PerformanceIndicatorService {

    private final PerformanceIndicatorRepository repository;
    private final DepartmentMasterRepository departmentRepository;
    private final DesignationMasterRepository designationRepository;

    public PerformanceIndicatorService(PerformanceIndicatorRepository repository,
                                       DepartmentMasterRepository departmentRepository,
                                       DesignationMasterRepository designationRepository) {
        this.repository = repository;
        this.departmentRepository = departmentRepository;
        this.designationRepository = designationRepository;
    }

    @Transactional(readOnly = true)
    public List<PerformanceIndicatorResponse> list() {
        return repository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public PerformanceIndicatorResponse create(PerformanceIndicatorRequest request) {
        PerformanceIndicator row = new PerformanceIndicator();
        apply(row, request);
        return toResponse(repository.save(row));
    }

    public PerformanceIndicatorResponse update(Long id, PerformanceIndicatorRequest request) {
        PerformanceIndicator row = repository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Performance indicator not found"));
        apply(row, request);
        return toResponse(repository.save(row));
    }

    public void delete(Long id) {
        PerformanceIndicator row = repository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Performance indicator not found"));
        row.setDeleted(true);
        repository.save(row);
    }

    private void apply(PerformanceIndicator row, PerformanceIndicatorRequest request) {
        DepartmentMaster department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));
        DesignationMaster designation = designationRepository.findById(request.getDesignationId())
                .orElseThrow(() -> new EntityNotFoundException("Designation not found"));

        row.setDepartment(department);
        row.setDesignation(designation);
        row.setApprovedBy(request.getApprovedBy());
        row.setCustomerExperience(request.getCustomerExperience());
        row.setMarketing(request.getMarketing());
        row.setManagement(request.getManagement());
        row.setAdministration(request.getAdministration());
        row.setPresentationSkills(request.getPresentationSkills());
        row.setQualityOfWork(request.getQualityOfWork());
        row.setEfficiency(request.getEfficiency());
        row.setIntegrity(request.getIntegrity());
        row.setProfessionalism(request.getProfessionalism());
        row.setTeamWork(request.getTeamWork());
        row.setCriticalThinking(request.getCriticalThinking());
        row.setConflictManagement(request.getConflictManagement());
        row.setAttendance(request.getAttendance());
        row.setAbilityToMeetDeadline(request.getAbilityToMeetDeadline());
        row.setStatus(request.getStatus());
    }

    private PerformanceIndicatorResponse toResponse(PerformanceIndicator row) {
        PerformanceIndicatorResponse res = new PerformanceIndicatorResponse();
        res.setId(row.getId());
        if (row.getDesignation() != null) {
            res.setDesignationId(row.getDesignation().getId());
            res.setDesignationName(row.getDesignation().getName());
        }
        if (row.getDepartment() != null) {
            res.setDepartmentId(row.getDepartment().getId());
            res.setDepartmentName(row.getDepartment().getName());
        }
        res.setApprovedBy(row.getApprovedBy());
        res.setCreatedDate(row.getCreatedAt());
        res.setStatus(row.getStatus());
        res.setCustomerExperience(row.getCustomerExperience());
        res.setMarketing(row.getMarketing());
        res.setManagement(row.getManagement());
        res.setAdministration(row.getAdministration());
        res.setPresentationSkills(row.getPresentationSkills());
        res.setQualityOfWork(row.getQualityOfWork());
        res.setEfficiency(row.getEfficiency());
        res.setIntegrity(row.getIntegrity());
        res.setProfessionalism(row.getProfessionalism());
        res.setTeamWork(row.getTeamWork());
        res.setCriticalThinking(row.getCriticalThinking());
        res.setConflictManagement(row.getConflictManagement());
        res.setAttendance(row.getAttendance());
        res.setAbilityToMeetDeadline(row.getAbilityToMeetDeadline());
        return res;
    }
}
