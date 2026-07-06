package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.EmployeeFormLinkResponse;
import com.nexorcrm.backend.dto.EmployeeVerificationResponse;
import com.nexorcrm.backend.dto.VerifyEmployeeFieldsRequest;
import com.nexorcrm.backend.entity.EmployeeTokenScope;
import com.nexorcrm.backend.service.EmployeeProfileFormService;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeProfileController {

    private final EmployeeProfileFormService employeeProfileFormService;

    public EmployeeProfileController(EmployeeProfileFormService employeeProfileFormService) {
        this.employeeProfileFormService = employeeProfileFormService;
    }

    @PostMapping("/{employeeId}/form-link")
    public EmployeeFormLinkResponse generateFormLink(@PathVariable Long employeeId) {
        return employeeProfileFormService.generateFormLink(employeeId, EmployeeTokenScope.MISSING_FIELDS);
    }

    @PostMapping("/{employeeId}/send-offer-letter")
    public EmployeeFormLinkResponse sendOfferLetter(@PathVariable Long employeeId) {
        return employeeProfileFormService.sendOfferLetterEmail(employeeId);
    }

    @PostMapping("/{employeeId}/resend-offer-letter")
    public EmployeeFormLinkResponse resendOfferLetter(@PathVariable Long employeeId) {
        return employeeProfileFormService.resendOfferLetterEmail(employeeId);
    }

    @GetMapping("/{employeeId}/verification")
    public EmployeeVerificationResponse getVerification(@PathVariable Long employeeId) {
        return employeeProfileFormService.getVerification(employeeId);
    }

    @GetMapping("/{employeeId}/documents/{documentId}/file")
    public ResponseEntity<Resource> getDocumentFile(@PathVariable Long employeeId, @PathVariable Long documentId) {
        return employeeProfileFormService.getDocumentFile(employeeId, documentId);
    }

    @PostMapping("/{employeeId}/verify-fields")
    public EmployeeVerificationResponse verify(@PathVariable Long employeeId, @RequestBody VerifyEmployeeFieldsRequest request) {
        return employeeProfileFormService.verify(employeeId, request);
    }

    @PostMapping("/{employeeId}/resend-rejected-link")
    public ResponseEntity<?> resendRejected(@PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(employeeProfileFormService.resendRejectedLink(employeeId));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/{employeeId}/resend-profile-completion-mail")
    public EmployeeFormLinkResponse resendProfileCompletionMail(@PathVariable Long employeeId) {
        return employeeProfileFormService.resendProfileCompletionMail(employeeId);
    }
}
