package com.nexorcrm.backend.dto;

import java.util.List;

public class LeavePolicyResponse {

    private Long id;
    private Long leaveTypeId;
    private String leaveTypeName;
    private String name;
    private Integer daysPerYear;
    private Boolean carryForwardEnabled;
    private Integer maxCarryForwardDays;
    private Integer maxDaysPerRequest;
    private Boolean earnedLeaveEnabled;
    private List<Long> employeeIds;
    private List<String> employeeNames;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLeaveTypeId() { return leaveTypeId; }
    public void setLeaveTypeId(Long leaveTypeId) { this.leaveTypeId = leaveTypeId; }

    public String getLeaveTypeName() { return leaveTypeName; }
    public void setLeaveTypeName(String leaveTypeName) { this.leaveTypeName = leaveTypeName; }

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

    public List<String> getEmployeeNames() { return employeeNames; }
    public void setEmployeeNames(List<String> employeeNames) { this.employeeNames = employeeNames; }
}
