package com.nexorcrm.backend.exception;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return buildError(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid email or password");
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, Object>> handleDisabled(DisabledException ex) {
        return buildError(HttpStatus.FORBIDDEN, "Forbidden", "Account is deactivated");
    }

    @ExceptionHandler(TokenRefreshException.class)
    public ResponseEntity<Map<String, Object>> handleTokenRefresh(TokenRefreshException ex) {
        return buildError(HttpStatus.UNAUTHORIZED, "Unauthorized", "Refresh token invalid or expired");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        String message = (ex.getMessage() == null || ex.getMessage().isBlank())
                ? "You do not have permission"
                : ex.getMessage();
        return buildError(HttpStatus.FORBIDDEN, "Forbidden", message);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleBadJson(HttpMessageNotReadableException ex) {
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", "Malformed JSON request");
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleEntityNotFound(EntityNotFoundException ex) {
        String message = (ex.getMessage() == null || ex.getMessage().isBlank())
                ? "Resource not found"
                : ex.getMessage();
        return buildError(HttpStatus.NOT_FOUND, "Not Found", message);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFound(NoResourceFoundException ex) {
        return buildError(HttpStatus.NOT_FOUND, "Not Found", "Resource not found");
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage());
    }

    @ExceptionHandler(MailAuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleMailAuthentication(MailAuthenticationException ex) {
        log.warn("Mail authentication failed: {}", ex.getMessage());
        return buildError(HttpStatus.BAD_GATEWAY,
                "Bad Gateway",
                "Mail authentication failed. Please verify the SMTP username/password or app password on the server.");
    }

    @ExceptionHandler(MailSendException.class)
    public ResponseEntity<Map<String, Object>> handleMailSend(MailSendException ex) {
        String detail = findMailSendDetail(ex);
        log.warn("Mail send failed: {}", detail == null ? ex.getMessage() : detail);

        if (detail != null && containsAnyIgnoreCase(detail,
                "daily user sending limit exceeded",
                "daily limit exceeded",
                "sending limit exceeded")) {
            return buildError(HttpStatus.TOO_MANY_REQUESTS,
                    "Too Many Requests",
                    "Gmail sending limit was reached. Please try again later or use another SMTP account.");
        }

        return buildError(HttpStatus.BAD_GATEWAY,
                "Bad Gateway",
                "Email delivery failed. Please verify the SMTP configuration or provider sending limits.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        // Avoid leaking low-level DB errors to the UI; callers can adjust the request.
        log.warn("Data integrity violation: {}", ex.getMostSpecificCause() == null ? ex.getMessage() : ex.getMostSpecificCause().getMessage());
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", "Invalid request");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUpload(MaxUploadSizeExceededException ex) {
        return buildError(HttpStatus.PAYLOAD_TOO_LARGE, "Payload Too Large", "Upload too large. Please reduce file sizes and try again.");
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, Object>> handleMultipart(MultipartException ex) {
        // Commonly thrown for multipart parse issues (too many parts, exceeded limits, invalid form data).
        log.warn("Multipart error: {}", ex.getMessage());
        return buildError(HttpStatus.BAD_REQUEST, "Bad Request", "Failed to upload form. Please check file count/size and try again.");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleOther(Exception ex) {
        log.error("Unhandled exception", ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Something went wrong");
    }

    private ResponseEntity<Map<String, Object>> buildError(HttpStatus status, String error, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("error", error);
        body.put("message", message);
        body.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.status(status).body(body);
    }

    private static String findMailSendDetail(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            String message = current.getMessage();
            if (message != null && !message.isBlank()) {
                return message;
            }
            current = current.getCause();
        }
        return null;
    }

    private static boolean containsAnyIgnoreCase(String value, String... terms) {
        String lower = value.toLowerCase();
        for (String term : terms) {
            if (lower.contains(term.toLowerCase())) {
                return true;
            }
        }
        return false;
    }
}
