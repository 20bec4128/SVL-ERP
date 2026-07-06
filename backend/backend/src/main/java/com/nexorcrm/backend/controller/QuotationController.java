package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.QuotationActionRequest;
import com.nexorcrm.backend.dto.QuotationRequest;
import com.nexorcrm.backend.dto.QuotationResponse;
import com.nexorcrm.backend.service.QuotationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/quotations")
public class QuotationController {

    private final QuotationService quotationService;

    public QuotationController(QuotationService quotationService) {
        this.quotationService = quotationService;
    }

    @PostMapping
    public QuotationResponse create(@RequestBody QuotationRequest request) {
        return quotationService.createQuotation(request);
    }

    @GetMapping("/lead/{leadId}")
    public List<QuotationResponse> getByLead(@PathVariable Long leadId) {
        return quotationService.getQuotationsByLead(leadId);
    }

    @GetMapping("/{id}")
    public QuotationResponse getById(@PathVariable Long id) {
        return quotationService.getQuotationById(id);
    }

    @GetMapping
    public List<QuotationResponse> getAll(Authentication authentication) {
        return quotationService.getAllQuotations(authentication != null ? authentication.getName() : null);
    }

    @PutMapping("/{id}")
    public QuotationResponse update(
            @PathVariable Long id,
            @RequestBody QuotationRequest request) {
        return quotationService.updateQuotation(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        quotationService.deleteQuotation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/verify")
    public QuotationResponse verify(
            @PathVariable Long id,
            @RequestBody(required = false) QuotationActionRequest request) {
        return quotationService.sendForVerification(id, request);
    }

    @PostMapping("/{id}/approve")
    public QuotationResponse approve(
            @PathVariable Long id,
            @RequestBody(required = false) QuotationActionRequest request) {
        return quotationService.approveQuotation(id, request);
    }

    @PostMapping("/{id}/admin-reject")
    public QuotationResponse adminReject(
            @PathVariable Long id,
            @RequestBody(required = false) QuotationActionRequest request) {
        return quotationService.adminRejectQuotation(id, request);
    }

    @PostMapping("/{id}/mark-sent")
    public QuotationResponse markSent(
            @PathVariable Long id,
            @RequestParam(name = "sendEmail", defaultValue = "false") boolean sendEmail,
            @RequestParam(name = "file", required = false) MultipartFile file) {
        return quotationService.markSent(id, sendEmail, file);
    }

    @PostMapping("/{id}/mark-negotiating")
    public QuotationResponse markNegotiating(
            @PathVariable Long id,
            @RequestBody(required = false) QuotationActionRequest request) {
        return quotationService.markNegotiating(id, request);
    }

    @PostMapping("/{id}/mark-rejected")
    public QuotationResponse markRejected(
            @PathVariable Long id,
            @RequestBody(required = false) QuotationActionRequest request) {
        return quotationService.markRejected(id, request);
    }

    @PostMapping("/{id}/mark-accepted")
    public QuotationResponse markAccepted(
            @PathVariable Long id,
            @RequestBody(required = false) QuotationActionRequest request) {
        return quotationService.markAccepted(id, request);
    }
}
