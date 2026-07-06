package com.nexorcrm.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class DesignChoice {
    @NotBlank(message = "action is required")
    private String action; // Accept, Change, Reject, Continue
    private String comment; // optional when requesting change

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}