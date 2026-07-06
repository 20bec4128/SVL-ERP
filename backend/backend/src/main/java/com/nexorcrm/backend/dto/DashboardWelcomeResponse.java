package com.nexorcrm.backend.dto;

public class DashboardWelcomeResponse {
    private String name;
    private long pendingApprovals;
    private long leaveRequests;
    private String avatar;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public long getPendingApprovals() {
        return pendingApprovals;
    }

    public void setPendingApprovals(long pendingApprovals) {
        this.pendingApprovals = pendingApprovals;
    }

    public long getLeaveRequests() {
        return leaveRequests;
    }

    public void setLeaveRequests(long leaveRequests) {
        this.leaveRequests = leaveRequests;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
}
