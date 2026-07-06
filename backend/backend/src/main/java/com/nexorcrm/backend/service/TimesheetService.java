package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.TimesheetRequest;
import com.nexorcrm.backend.dto.TimesheetResponse;
import com.nexorcrm.backend.entity.Timesheet;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.TimesheetRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TimesheetService {

    private final TimesheetRepository repository;
    private final EmployeeRepository employeeRepository;

    public TimesheetService(TimesheetRepository repository, EmployeeRepository employeeRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
    }

    public List<TimesheetResponse> listAll() {
        return repository.findByDeletedFalseOrderByIdDesc()
                .stream().map(this::toResponse).toList();
    }

    public TimesheetResponse create(TimesheetRequest request) {
        Timesheet t = new Timesheet();
        apply(t, request);
        Timesheet saved = repository.save(t);
        return toResponse(saved);
    }

    public TimesheetResponse update(Long id, TimesheetRequest request) {
        Timesheet t = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Timesheet not found"));
        if (Boolean.TRUE.equals(t.getDeleted())) {
            throw new EntityNotFoundException("Timesheet not found");
        }
        apply(t, request);
        Timesheet saved = repository.save(t);
        return toResponse(saved);
    }

    public void delete(Long id) {
        Timesheet t = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Timesheet not found"));
        t.setDeleted(true);
        repository.save(t);
    }

    private void apply(Timesheet t, TimesheetRequest request) {
        t.setEmployeeId(request.getEmployeeId());
        t.setProjectName(request.getProjectName() != null ? request.getProjectName().trim() : null);
        t.setDeadline(request.getDeadline());
        t.setTotalHours(request.getTotalHours());
        t.setRemainingHours(request.getRemainingHours());
        t.setWorkDate(request.getWorkDate());
        t.setWorkedHours(request.getWorkedHours());
    }

    private TimesheetResponse toResponse(Timesheet t) {
        TimesheetResponse r = new TimesheetResponse();
        r.setId(t.getId());
        r.setEmployeeId(t.getEmployeeId());
        r.setProjectName(t.getProjectName());
        r.setDeadline(t.getDeadline());
        r.setTotalHours(t.getTotalHours());
        r.setRemainingHours(t.getRemainingHours());
        r.setWorkDate(t.getWorkDate());
        r.setWorkedHours(t.getWorkedHours());

        if (t.getEmployeeId() != null) {
            employeeRepository.findById(t.getEmployeeId()).ifPresent(emp -> {
                r.setEmployeeName(emp.getName());
                r.setEmployeeDept(emp.getDept());
                r.setEmployeeDesignation(emp.getDesignation());
            });
        }
        return r;
    }
}
