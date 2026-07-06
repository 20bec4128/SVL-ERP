package com.nexorcrm.backend.dto;

import java.time.LocalDateTime;

public class ChatNotificationResponse {
    private Long leadId;
    private Long messageId;
    private String threadType;
    private String message;
    private String senderRole;
    private LocalDateTime createdAt;

    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }
    public Long getMessageId() { return messageId; }
    public void setMessageId(Long messageId) { this.messageId = messageId; }
    public String getThreadType() { return threadType; }
    public void setThreadType(String threadType) { this.threadType = threadType; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
