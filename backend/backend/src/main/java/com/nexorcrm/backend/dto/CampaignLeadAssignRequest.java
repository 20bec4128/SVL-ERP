package com.nexorcrm.backend.dto;

public class CampaignLeadAssignRequest {
    private Long employeeId;
    private Long leadGroupId;

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public Long getLeadGroupId() { return leadGroupId; }
    public void setLeadGroupId(Long leadGroupId) { this.leadGroupId = leadGroupId; }
}
