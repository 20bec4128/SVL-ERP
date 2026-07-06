package com.nexorcrm.backend.dto;

public class LeaveTypeResponse {

    private Long id;
    private String name;
    private Boolean enabled;
    private Integer daysPerYear;
    private Boolean carryForwardEnabled;
    private Integer maxCarryForwardDays;
    private Integer maxDaysPerRequest;
    private Boolean earnedLeaveEnabled;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

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
}
