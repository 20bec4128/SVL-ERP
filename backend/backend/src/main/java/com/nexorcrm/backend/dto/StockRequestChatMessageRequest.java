package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class StockRequestChatMessageRequest {
    @NotBlank(message = "message is required")
    private String message;
    // we don't need threadType for stock requests (only one internal thread)

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
