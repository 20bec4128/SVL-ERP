package com.nexorcrm.backend.dto;

import java.math.BigDecimal;

public class LeaveEligibilityResponse {

    private String leaveType;
    private String policyName;
    private BigDecimal allowedDays;
    private BigDecimal usedDays;
    private BigDecimal remainingDays;

    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }

    public String getPolicyName() { return policyName; }
    public void setPolicyName(String policyName) { this.policyName = policyName; }

    public BigDecimal getAllowedDays() { return allowedDays; }
    public void setAllowedDays(BigDecimal allowedDays) { this.allowedDays = allowedDays; }

    public BigDecimal getUsedDays() { return usedDays; }
    public void setUsedDays(BigDecimal usedDays) { this.usedDays = usedDays; }

    public BigDecimal getRemainingDays() { return remainingDays; }
    public void setRemainingDays(BigDecimal remainingDays) { this.remainingDays = remainingDays; }
}
