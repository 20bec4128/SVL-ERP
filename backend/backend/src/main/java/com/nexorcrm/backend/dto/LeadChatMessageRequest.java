package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import com.nexorcrm.backend.dto.DesignChoice; 

public class LeadChatMessageRequest {
    @NotBlank(message = "threadType is required")
    private String threadType;
    @NotBlank(message = "message is required")
    private String message;
    // when threadType indicates a design decision, the payload goes here
    private DesignChoice designChoice;

    public String getThreadType() { return threadType; }
    public void setThreadType(String threadType) { this.threadType = threadType; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public DesignChoice getDesignChoice() { return designChoice; }
    public void setDesignChoice(DesignChoice designChoice) { this.designChoice = designChoice; }
}
