package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.LeaveEligibilityResponse;
import com.nexorcrm.backend.dto.LeavePolicyRequest;
import com.nexorcrm.backend.dto.LeavePolicyResponse;
import com.nexorcrm.backend.dto.LeaveTypeRequest;
import com.nexorcrm.backend.dto.LeaveTypeResponse;
import com.nexorcrm.backend.service.LeaveSettingsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave-settings")
public class LeaveSettingsController {

    private final LeaveSettingsService service;

    public LeaveSettingsController(LeaveSettingsService service) {
        this.service = service;
    }

    @GetMapping("/types")
    public List<LeaveTypeResponse> listTypes() {
        return service.listLeaveTypes();
    }

    @PostMapping("/types")
    public LeaveTypeResponse createType(@Valid @RequestBody LeaveTypeRequest request) {
        return service.createLeaveType(request);
    }

    @PutMapping("/types/{id}")
    public LeaveTypeResponse updateType(@PathVariable Long id, @Valid @RequestBody LeaveTypeRequest request) {
        return service.updateLeaveType(id, request);
    }

    @DeleteMapping("/types/{id}")
    public void deleteType(@PathVariable Long id) {
        service.deleteLeaveType(id);
    }


    @GetMapping("/types/{leaveTypeId}/policies")
    public List<LeavePolicyResponse> listPolicies(@PathVariable Long leaveTypeId) {
        return service.listPolicies(leaveTypeId);
    }

    @GetMapping("/policies")
    public List<LeavePolicyResponse> listAllPolicies() {
        return service.listPoliciesAll();
    }

    @PostMapping("/policies")
    public LeavePolicyResponse createPolicy(@Valid @RequestBody LeavePolicyRequest request) {
        return service.createPolicy(request);
    }

    @PutMapping("/policies/{id}")
    public LeavePolicyResponse updatePolicy(@PathVariable Long id, @Valid @RequestBody LeavePolicyRequest request) {
        return service.updatePolicy(id, request);
    }

    @DeleteMapping("/policies/{id}")
    public void deletePolicy(@PathVariable Long id) {
        service.deletePolicy(id);
    }

    @GetMapping("/eligibility/{employeeId}")
    public List<LeaveEligibilityResponse> eligibility(@PathVariable Long employeeId) {
        return service.getEligibility(employeeId);
    }
}
