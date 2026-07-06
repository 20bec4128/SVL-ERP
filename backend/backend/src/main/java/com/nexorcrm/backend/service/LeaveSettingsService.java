package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.LeaveEligibilityResponse;
import com.nexorcrm.backend.dto.LeavePolicyRequest;
import com.nexorcrm.backend.dto.LeavePolicyResponse;
import com.nexorcrm.backend.dto.LeaveTypeRequest;
import com.nexorcrm.backend.dto.LeaveTypeResponse;
import com.nexorcrm.backend.entity.LeavePolicy;
import com.nexorcrm.backend.entity.LeavePolicyEmployee;
import com.nexorcrm.backend.entity.LeaveType;
import com.nexorcrm.backend.entity.LeaveTypeSettings;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.LeavePolicyEmployeeRepository;
import com.nexorcrm.backend.repo.LeavePolicyRepository;
import com.nexorcrm.backend.repo.LeaveRepository;
import com.nexorcrm.backend.repo.LeaveTypeRepository;
import com.nexorcrm.backend.repo.LeaveTypeSettingsRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Service
@Transactional
public class LeaveSettingsService {

    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveTypeSettingsRepository settingsRepository;
    private final LeavePolicyRepository policyRepository;
    private final LeavePolicyEmployeeRepository policyEmployeeRepository;
    private final LeaveRepository leaveRepository;
    private final EmployeeRepository employeeRepository;

    public LeaveSettingsService(
            LeaveTypeRepository leaveTypeRepository,
            LeaveTypeSettingsRepository settingsRepository,
            LeavePolicyRepository policyRepository,
            LeavePolicyEmployeeRepository policyEmployeeRepository,
            LeaveRepository leaveRepository,
            EmployeeRepository employeeRepository
    ) {
        this.leaveTypeRepository = leaveTypeRepository;
        this.settingsRepository = settingsRepository;
        this.policyRepository = policyRepository;
        this.policyEmployeeRepository = policyEmployeeRepository;
        this.leaveRepository = leaveRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> listLeaveTypes() {
        return leaveTypeRepository.findAll().stream().map(this::toTypeResponse).toList();
    }

    public LeaveTypeResponse createLeaveType(LeaveTypeRequest request) {
        LeaveType type = new LeaveType();
        type.setName(request.getName().trim());
        type.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        LeaveType saved = leaveTypeRepository.save(type);

        LeaveTypeSettings settings = new LeaveTypeSettings();
        settings.setLeaveType(saved);
        applySettings(settings, request);
        settingsRepository.save(settings);

        return toTypeResponse(saved, settings);
    }

    public LeaveTypeResponse updateLeaveType(Long id, LeaveTypeRequest request) {
        LeaveType type = leaveTypeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Leave type not found"));
        type.setName(request.getName().trim());
        type.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        LeaveType saved = leaveTypeRepository.save(type);

        LeaveTypeSettings settings = settingsRepository.findByLeaveType_Id(saved.getId())
                .orElseGet(() -> {
                    LeaveTypeSettings s = new LeaveTypeSettings();
                    s.setLeaveType(saved);
                    return s;
                });
        applySettings(settings, request);
        settingsRepository.save(settings);

        return toTypeResponse(saved, settings);
    }

    @Transactional(readOnly = true)
    public List<LeavePolicyResponse> listPolicies(Long leaveTypeId) {
        return policyRepository.findByDeletedFalseAndLeaveType_IdOrderByNameAsc(leaveTypeId)
                .stream().map(this::toPolicyResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<LeavePolicyResponse> listPoliciesAll() {
        return policyRepository.findByDeletedFalseOrderByNameAsc()
                .stream().map(this::toPolicyResponse).toList();
    }

    public LeavePolicyResponse createPolicy(LeavePolicyRequest request) {
        LeavePolicy policy = new LeavePolicy();
        if (request.getLeaveTypeId() != null) {
            LeaveType type = leaveTypeRepository.findById(request.getLeaveTypeId())
                    .orElseThrow(() -> new EntityNotFoundException("Leave type not found"));
            policy.setLeaveType(type);
        }
        applyPolicy(policy, request);
        LeavePolicy saved = policyRepository.save(policy);
        replaceEmployees(saved, request.getEmployeeIds());
        return toPolicyResponse(saved);
    }

    public LeavePolicyResponse updatePolicy(Long id, LeavePolicyRequest request) {
        LeavePolicy policy = policyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Policy not found"));
        if (Boolean.TRUE.equals(policy.getDeleted())) {
            throw new EntityNotFoundException("Policy not found");
        }
        if (request.getLeaveTypeId() != null) {
            LeaveType type = leaveTypeRepository.findById(request.getLeaveTypeId())
                    .orElseThrow(() -> new EntityNotFoundException("Leave type not found"));
            policy.setLeaveType(type);
        }
        applyPolicy(policy, request);
        LeavePolicy saved = policyRepository.save(policy);
        replaceEmployees(saved, request.getEmployeeIds());
        return toPolicyResponse(saved);
    }

    public void deletePolicy(Long id) {
        LeavePolicy policy = policyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Policy not found"));
        policy.setDeleted(true);
        policyRepository.save(policy);
    }

    public void deleteLeaveType(Long id) {
        LeaveType type = leaveTypeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Leave type not found"));
        settingsRepository.findByLeaveType_Id(id).ifPresent(settingsRepository::delete);
        List<LeavePolicy> policies = policyRepository.findByDeletedFalseAndLeaveType_IdOrderByNameAsc(id);
        for (LeavePolicy policy : policies) {
            policy.setLeaveType(null);
            policyRepository.save(policy);
        }
        leaveTypeRepository.delete(type);
    }


    @Transactional(readOnly = true)
    public List<LeaveEligibilityResponse> getEligibility(Long employeeId) {
        List<LeaveEligibilityResponse> items = new ArrayList<>();
        int year = LocalDate.now().getYear();

        List<LeavePolicy> policies = policyRepository.findPoliciesForEmployee(employeeId);
        for (LeavePolicy policy : policies) {
            BalanceSnapshot balance = getBalanceForPolicy(policy, employeeId, year, null);
            LeaveEligibilityResponse r = new LeaveEligibilityResponse();
            r.setLeaveType(policy.getName());
            r.setPolicyName(policy.getName());
            r.setAllowedDays(balance.allowedDays);
            r.setUsedDays(balance.usedDays);
            r.setRemainingDays(balance.remainingDays);
            items.add(r);
        }

        return items;
    }

    BigDecimal sumApproved(Long employeeId, String policyName, LocalDate start, LocalDate end, Long excludeId) {
        return leaveRepository.sumApprovedDays(employeeId, policyName, start, end, excludeId);
    }

    BalanceSnapshot getBalanceForPolicyName(Long employeeId, String policyName, int year, Long excludeId) {
        return policyRepository.findPolicyForEmployeeByName(employeeId, policyName)
                .map((policy) -> getBalanceForPolicy(policy, employeeId, year, excludeId))
                .orElse(null);
    }

    private BalanceSnapshot getBalanceForPolicy(LeavePolicy policy, Long employeeId, int year, Long excludeId) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        BigDecimal used = sumApproved(employeeId, policy.getName(), start, end, excludeId);

        BigDecimal carry = BigDecimal.ZERO;
        if (Boolean.TRUE.equals(policy.getCarryForwardEnabled())
                && policy.getMaxCarryForwardDays() != null
                && policy.getMaxCarryForwardDays() > 0) {
            int prevYear = year - 1;
            LocalDate prevStart = LocalDate.of(prevYear, 1, 1);
            LocalDate prevEnd = LocalDate.of(prevYear, 12, 31);
            BigDecimal usedPrev = sumApproved(employeeId, policy.getName(), prevStart, prevEnd, null);
            BigDecimal allowedPrev = BigDecimal.valueOf(policy.getDaysPerYear() != null ? policy.getDaysPerYear() : 0);
            BigDecimal remainingPrev = allowedPrev.subtract(usedPrev);
            if (remainingPrev.compareTo(BigDecimal.ZERO) < 0) remainingPrev = BigDecimal.ZERO;
            BigDecimal maxCarry = BigDecimal.valueOf(policy.getMaxCarryForwardDays());
            carry = remainingPrev.min(maxCarry);
        }

        BigDecimal allowed = BigDecimal.valueOf(policy.getDaysPerYear() != null ? policy.getDaysPerYear() : 0).add(carry);
        BigDecimal remaining = allowed.subtract(used);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;
        return new BalanceSnapshot(allowed, used, remaining, policy.getMaxDaysPerRequest());
    }

    private LeaveTypeResponse toTypeResponse(LeaveType type) {
        LeaveTypeSettings settings = settingsRepository.findByLeaveType_Id(type.getId()).orElse(null);
        return toTypeResponse(type, settings);
    }

    private LeaveTypeResponse toTypeResponse(LeaveType type, LeaveTypeSettings settings) {
        LeaveTypeResponse r = new LeaveTypeResponse();
        r.setId(type.getId());
        r.setName(type.getName());
        r.setEnabled(type.getEnabled());
        if (settings != null) {
            r.setDaysPerYear(settings.getDaysPerYear());
            r.setCarryForwardEnabled(settings.getCarryForwardEnabled());
            r.setMaxCarryForwardDays(settings.getMaxCarryForwardDays());
            r.setMaxDaysPerRequest(settings.getMaxDaysPerRequest());
            r.setEarnedLeaveEnabled(settings.getEarnedLeaveEnabled());
        }
        return r;
    }

    private LeavePolicyResponse toPolicyResponse(LeavePolicy policy) {
        LeavePolicyResponse r = new LeavePolicyResponse();
        r.setId(policy.getId());
        if (policy.getLeaveType() != null) {
            r.setLeaveTypeId(policy.getLeaveType().getId());
            r.setLeaveTypeName(policy.getLeaveType().getName());
        } else {
            r.setLeaveTypeId(null);
            r.setLeaveTypeName(null);
        }
        r.setName(policy.getName());
        r.setDaysPerYear(policy.getDaysPerYear());
        r.setCarryForwardEnabled(policy.getCarryForwardEnabled());
        r.setMaxCarryForwardDays(policy.getMaxCarryForwardDays());
        r.setMaxDaysPerRequest(policy.getMaxDaysPerRequest());
        r.setEarnedLeaveEnabled(policy.getEarnedLeaveEnabled());
        List<Long> ids = policy.getEmployees().stream().map(LeavePolicyEmployee::getEmployeeId).toList();
        r.setEmployeeIds(ids);
        if (!ids.isEmpty()) {
            var map = employeeRepository.findAllById(ids).stream()
                    .collect(java.util.stream.Collectors.toMap(e -> e.getId(), e -> e.getName() != null ? e.getName() : ""));
            List<String> names = new ArrayList<>();
            for (Long id : ids) {
                String name = map.getOrDefault(id, "");
                if (!name.isBlank()) names.add(name);
            }
            r.setEmployeeNames(names);
        } else {
            r.setEmployeeNames(List.of());
        }
        return r;
    }

    private void applySettings(LeaveTypeSettings settings, LeaveTypeRequest request) {
        settings.setDaysPerYear(Math.max(request.getDaysPerYear(), 0));
        settings.setCarryForwardEnabled(Boolean.TRUE.equals(request.getCarryForwardEnabled()));
        settings.setMaxCarryForwardDays(request.getMaxCarryForwardDays());
        settings.setMaxDaysPerRequest(request.getMaxDaysPerRequest());
        settings.setEarnedLeaveEnabled(Boolean.TRUE.equals(request.getEarnedLeaveEnabled()));
    }

    private void applyPolicy(LeavePolicy policy, LeavePolicyRequest request) {
        policy.setName(request.getName().trim());
        policy.setDaysPerYear(Math.max(request.getDaysPerYear(), 0));
        policy.setCarryForwardEnabled(Boolean.TRUE.equals(request.getCarryForwardEnabled()));
        policy.setMaxCarryForwardDays(request.getMaxCarryForwardDays());
        policy.setMaxDaysPerRequest(request.getMaxDaysPerRequest());
        policy.setEarnedLeaveEnabled(Boolean.TRUE.equals(request.getEarnedLeaveEnabled()));
    }

    private void replaceEmployees(LeavePolicy policy, List<Long> employeeIds) {
        policyEmployeeRepository.deleteByPolicyId(policy.getId());
        if (employeeIds == null || employeeIds.isEmpty()) return;
        List<LeavePolicyEmployee> rows = new ArrayList<>();
        for (Long empId : new LinkedHashSet<>(employeeIds)) {
            if (empId == null) continue;
            LeavePolicyEmployee row = new LeavePolicyEmployee();
            row.setPolicy(policy);
            row.setEmployeeId(empId);
            rows.add(row);
        }
        policyEmployeeRepository.saveAll(rows);
    }

    static class BalanceSnapshot {
        final BigDecimal allowedDays;
        final BigDecimal usedDays;
        final BigDecimal remainingDays;
        final Integer maxDaysPerRequest;

        BalanceSnapshot(BigDecimal allowedDays, BigDecimal usedDays, BigDecimal remainingDays, Integer maxDaysPerRequest) {
            this.allowedDays = allowedDays;
            this.usedDays = usedDays;
            this.remainingDays = remainingDays;
            this.maxDaysPerRequest = maxDaysPerRequest;
        }
    }
}
