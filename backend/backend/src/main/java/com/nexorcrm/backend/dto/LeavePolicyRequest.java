package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class LeavePolicyRequest {

    private Long leaveTypeId;

    @NotBlank
    private String name;

    @NotNull
    private Integer daysPerYear;

    private Boolean carryForwardEnabled = false;

    private Integer maxCarryForwardDays;

    private Integer maxDaysPerRequest;

    private Boolean earnedLeaveEnabled = false;

    private List<Long> employeeIds;

    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getDaysPerYear() { return daysPerYear; }
    public void setDaysPerYear(Integer daysPerYear) { this.daysPerYear = daysPerYear; }

    public Boolean getCarryForwardEnabled() { return carryForwardEnabled; }
    public void setCarryForwardEnabled(Boolean carryForwardEnabled) { this.carryForwardEnabled = carryForwardEnabled; }

    public Integer getMaxCarryForwardDays() { return maxCarryForwardDays; }
    public void setMaxCarryForwardDays(Integer maxCarryForwardDays) { this.maxCarryForwardDays = maxCarryForwardDays; }

    public Integer getMaxDaysPerRequest() { return maxDaysPerRequest; }
    public void setMaxDaysPerRequest(Integer maxDaysPerRequest) { this.maxDaysPerRequest = maxDaysPerRequest; }

    public Boolean getEarnedLeaveEnabled() { return earnedLeaveEnabled; }
    public void setEarnedLeaveEnabled(Boolean earnedLeaveEnabled) { this.earnedLeaveEnabled = earnedLeaveEnabled; }

    public List<Long> getEmployeeIds() { return employeeIds; }
    public void setEmployeeIds(List<Long> employeeIds) { this.employeeIds = employeeIds; }
}
