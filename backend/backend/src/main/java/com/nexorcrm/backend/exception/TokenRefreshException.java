package com.nexorcrm.backend.exception;

public class TokenRefreshException extends RuntimeException {
    public TokenRefreshException() {
        super("Refresh token invalid or expired. Please login again.");
    }
}
