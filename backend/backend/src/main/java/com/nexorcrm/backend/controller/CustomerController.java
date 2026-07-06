package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.LeadResponse;
import com.nexorcrm.backend.dto.LeadChatMessageRequest;
import com.nexorcrm.backend.dto.LeadChatMessageResponse;
import com.nexorcrm.backend.service.LeadService;
import com.nexorcrm.backend.service.LeadChatService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import com.nexorcrm.backend.dto.PaymentRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    private final LeadService leadService;
    private final LeadChatService leadChatService;

    public CustomerController(LeadService leadService, LeadChatService leadChatService) {
        this.leadService = leadService;
        this.leadChatService = leadChatService;
    }

    @GetMapping("/lead")
    @PreAuthorize("hasRole('CUSTOMER')")
    public LeadResponse getCustomerLead(Authentication authentication) {
        return leadService.getCustomerLead(authentication.getName());
    }

    @PatchMapping("/lead/status")
    @PreAuthorize("hasRole('CUSTOMER')")
    public LeadResponse updateCustomerLeadStatus(@RequestBody com.nexorcrm.backend.dto.LeadUpdateStatusRequest request,
                                                 Authentication authentication) {
        return leadService.updateCustomerLeadStatus(request, authentication.getName());
    }

    @GetMapping("/chat/messages")
    @PreAuthorize("hasRole('CUSTOMER')")
    public java.util.List<LeadChatMessageResponse> listCustomerMessages(Authentication authentication) {
        return leadChatService.listCustomerMessages(authentication.getName());
    }

    @GetMapping("/chat/notifications")
    @PreAuthorize("hasRole('CUSTOMER')")
    public java.util.List<com.nexorcrm.backend.dto.ChatNotificationResponse> listCustomerNotifications(
            @RequestParam(value = "since", required = false) String since,
            Authentication authentication) {
        return leadChatService.listCustomerNotifications(authentication.getName(), since);
    }

    @PostMapping("/chat/messages")
    @PreAuthorize("hasRole('CUSTOMER')")
    public LeadChatMessageResponse sendCustomerMessage(@RequestBody LeadChatMessageRequest request,
                                                       Authentication authentication) {
        return leadChatService.sendCustomerMessage(request, authentication.getName());
    }

    @PostMapping("/lead/payment")
    @PreAuthorize("hasRole('CUSTOMER')")
    public LeadResponse recordCustomerPayment(@RequestBody PaymentRequest request,
                                               Authentication authentication) {
        return leadService.recordCustomerPayment(authentication.getName(), request);
    }

    @PostMapping(value = "/chat/messages/file", consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('CUSTOMER')")
    public LeadChatMessageResponse sendCustomerMessageWithFile(@RequestParam(value = "message", required = false) String message,
                                                               @RequestParam(value = "file", required = false) MultipartFile file,
                                                               Authentication authentication) {
        return leadChatService.sendCustomerMessageWithFile(message, file, authentication.getName());
    }

    @GetMapping("/chat/messages/{messageId}/file")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Resource> getCustomerChatAttachment(@PathVariable("messageId") Long messageId,
                                                              Authentication authentication) {
        var message = leadChatService.getCustomerChatAttachment(messageId, authentication.getName());
        String path = message.getAttachmentPath();
        if (path == null || path.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Attachment not found");
        }
        Resource resource = new org.springframework.core.io.FileSystemResource(path);
        if (!resource.exists() || !resource.isReadable()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Attachment not found");
        }

        String filename = message.getAttachmentName();
        if (filename == null || filename.isBlank()) {
            filename = "attachment";
        }
        filename = filename.replace("\"", "");

        String contentType = message.getAttachmentType();
        MediaType mediaType;
        try {
            mediaType = contentType != null && !contentType.isBlank()
                    ? MediaType.parseMediaType(contentType)
                    : MediaType.APPLICATION_OCTET_STREAM;
        } catch (Exception ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        boolean inline = contentType != null && contentType.toLowerCase().startsWith("image/");
        String disposition = inline ? "inline" : "attachment";

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Content-Disposition", disposition + "; filename=\"" + filename + "\"")
                .body(resource);
    }
}
