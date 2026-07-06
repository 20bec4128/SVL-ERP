package com.nexorcrm.backend.dto;

import java.math.BigDecimal;

public class EmployeeLeaveSummaryResponse {
    private Integer totalRequests;
    private Integer approvedRequests;
    private Integer pendingRequests;
    private Integer declinedRequests;
    private BigDecimal totalDaysRequested;
    private String latestStatus;

    public Integer getTotalRequests() {
        return totalRequests;
    }

    public void setTotalRequests(Integer totalRequests) {
        this.totalRequests = totalRequests;
    }

    public Integer getApprovedRequests() {
        return approvedRequests;
    }

    public void setApprovedRequests(Integer approvedRequests) {
        this.approvedRequests = approvedRequests;
    }

    public Integer getPendingRequests() {
        return pendingRequests;
    }

    public void setPendingRequests(Integer pendingRequests) {
        this.pendingRequests = pendingRequests;
    }

    public Integer getDeclinedRequests() {
        return declinedRequests;
    }

    public void setDeclinedRequests(Integer declinedRequests) {
        this.declinedRequests = declinedRequests;
    }

    public BigDecimal getTotalDaysRequested() {
        return totalDaysRequested;
    }

    public void setTotalDaysRequested(BigDecimal totalDaysRequested) {
        this.totalDaysRequested = totalDaysRequested;
    }

    public String getLatestStatus() {
        return latestStatus;
    }

    public void setLatestStatus(String latestStatus) {
        this.latestStatus = latestStatus;
    }
}
