package com.nexorcrm.backend.dto;

public class ResetPasswordResponse {
    private String message;
    private String temporaryPassword;

    public ResetPasswordResponse() {
    }

    public ResetPasswordResponse(String message, String temporaryPassword) {
        this.message = message;
        this.temporaryPassword = temporaryPassword;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }

    public void setTemporaryPassword(String temporaryPassword) {
        this.temporaryPassword = temporaryPassword;
    }
}
