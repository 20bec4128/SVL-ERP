package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.LeaveRequest;
import com.nexorcrm.backend.dto.LeaveResponse;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.Leave;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.LeaveRepository;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.entity.User;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class LeaveService {

    private final LeaveRepository repository;
    private final EmployeeRepository employeeRepository;
    private final LeaveSettingsService settingsService;
    private final UserRepository userRepository;

    public LeaveService(LeaveRepository repository, 
                        EmployeeRepository employeeRepository, 
                        LeaveSettingsService settingsService,
                        UserRepository userRepository) {
        this.repository = repository;
        this.employeeRepository = employeeRepository;
        this.settingsService = settingsService;
        this.userRepository = userRepository;
    }

    public List<LeaveResponse> list() {
        return repository.findByDeletedFalseOrderByFromDateDesc()
                .stream().map(this::toResponse).toList();
    }

    public LeaveResponse create(LeaveRequest request) {
        Leave leave = new Leave();
        apply(leave, request);
        return toResponse(repository.save(leave));
    }

    public LeaveResponse update(Long id, LeaveRequest request) {
        return update(id, request, null);
    }

    public LeaveResponse update(Long id, LeaveRequest request, String actorEmail) {
        Leave leave = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Leave not found"));
        if (Boolean.TRUE.equals(leave.getDeleted())) {
            throw new EntityNotFoundException("Leave not found");
        }

        // Prevent self approval or rejection
        String newStatus = request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "NEW";
        if ("APPROVED".equals(newStatus) || "DECLINED".equals(newStatus)) {
            if (actorEmail != null) {
                User actor = userRepository.findByEmailAndIsDeletedFalse(actorEmail).orElse(null);
                if (actor != null && actor.getEmployeeId() != null) {
                    if (actor.getEmployeeId().equals(leave.getEmployeeId())) {
                        throw new IllegalArgumentException("You cannot approve or reject your own leave request.");
                    }
                }
            }
        }

        apply(leave, request);
        return toResponse(repository.save(leave));
    }

    public void delete(Long id) {
        Leave leave = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Leave not found"));
        leave.setDeleted(true);
        repository.save(leave);
    }

    private void apply(Leave leave, LeaveRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found"));
        validateDates(request.getFromDate(), request.getToDate());
        BigDecimal requestedDays = normalizeDays(request);
        validatePolicy(employee.getId(), request.getPolicyName(), request.getFromDate(), leave.getId(), requestedDays);

        leave.setEmployeeId(employee.getId());
        leave.setEmployeeName(employee.getName());
        leave.setDepartment(employee.getDept());
        leave.setLeaveType(request.getPolicyName().trim());
        leave.setFromDate(request.getFromDate());
        leave.setToDate(request.getToDate());
        leave.setNoOfDays(requestedDays);
        leave.setStatus(normalizeStatus(request.getStatus()));
        leave.setReason(request.getReason());
    }

    private void validateDates(LocalDate fromDate, LocalDate toDate) {
        if (fromDate == null || toDate == null) {
            throw new IllegalArgumentException("From and To dates are required");
        }
        if (toDate.isBefore(fromDate)) {
            throw new IllegalArgumentException("To date must be after From date");
        }
        if (fromDate.getYear() != toDate.getYear()) {
            throw new IllegalArgumentException("Leave must be within a single year (Jan-Dec)");
        }
    }

    private BigDecimal normalizeDays(LeaveRequest request) {
        if (request.getNoOfDays() != null) {
            return request.getNoOfDays().max(BigDecimal.valueOf(0.5));
        }
        long days = ChronoUnit.DAYS.between(request.getFromDate(), request.getToDate()) + 1;
        return BigDecimal.valueOf(Math.max(days, 1));
    }

    private void validatePolicy(Long employeeId, String policyName, LocalDate fromDate, Long leaveId, BigDecimal requestedDays) {
        if (requestedDays.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("No of days must be greater than zero");
        }
        int year = fromDate.getYear();
        LeaveSettingsService.BalanceSnapshot balance = settingsService.getBalanceForPolicyName(employeeId, policyName, year, leaveId);
        if (balance == null) {
            throw new IllegalArgumentException("No leave policy found for this employee");
        }
        if (balance.maxDaysPerRequest != null && balance.maxDaysPerRequest > 0) {
            BigDecimal max = BigDecimal.valueOf(balance.maxDaysPerRequest);
            if (requestedDays.compareTo(max) > 0) {
                throw new IllegalArgumentException("Requested days exceed per-request limit");
            }
        }
        if (requestedDays.compareTo(balance.remainingDays) > 0) {
            throw new IllegalArgumentException("Leave balance exceeded");
        }
    }

    private String normalizeStatus(String status) {
        String s = (status == null ? "NEW" : status).trim().toUpperCase();
        return switch (s) {
            case "APPROVED" -> "APPROVED";
            case "DECLINED" -> "DECLINED";
            default -> "NEW";
        };
    }

    private LeaveResponse toResponse(Leave leave) {
        LeaveResponse r = new LeaveResponse();
        r.setId(leave.getId());
        r.setEmployeeId(leave.getEmployeeId());
        r.setEmployeeName(leave.getEmployeeName());
        r.setDepartment(leave.getDepartment());
        r.setPolicyName(leave.getLeaveType());
        r.setFromDate(leave.getFromDate());
        r.setToDate(leave.getToDate());
        r.setNoOfDays(leave.getNoOfDays());
        r.setStatus(leave.getStatus());
        r.setReason(leave.getReason());
        return r;
    }
}
