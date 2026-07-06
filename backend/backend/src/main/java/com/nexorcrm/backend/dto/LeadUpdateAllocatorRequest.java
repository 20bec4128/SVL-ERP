package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotNull;

public class LeadUpdateAllocatorRequest {
    @NotNull(message = "ownerUserId is required")
    private Long ownerUserId;
    private Long targetGroupId;

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(Long ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public Long getTargetGroupId() {
        return targetGroupId;
    }

    public void setTargetGroupId(Long targetGroupId) {
        this.targetGroupId = targetGroupId;
    }
}
