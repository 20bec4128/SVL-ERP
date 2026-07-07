package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.LeadResponse;
import com.nexorcrm.backend.dto.LeadUpdateStatusRequest;
import com.nexorcrm.backend.dto.PaymentRequest;
import com.nexorcrm.backend.dto.LeadChatMessageResponse;
import com.nexorcrm.backend.dto.LeadChatMessageRequest;
import com.nexorcrm.backend.dto.ChatNotificationResponse;
import com.nexorcrm.backend.entity.LeadChatMessage;
import com.nexorcrm.backend.entity.LeadChatThreadType;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.service.LeadService;
import com.nexorcrm.backend.service.LeadChatService;
import jakarta.validation.Valid;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/customer")
public class CustomerPortalController {

    private final LeadService leadService;
    private final LeadChatService leadChatService;
    private final UserRepository userRepository;

    public CustomerPortalController(LeadService leadService,
                                    LeadChatService leadChatService,
                                    UserRepository userRepository) {
        this.leadService = leadService;
        this.leadChatService = leadChatService;
        this.userRepository = userRepository;
    }

    @GetMapping("/lead")
    public LeadResponse getCustomerLead(Authentication authentication) {
        String principal = authentication.getName();
        User user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(principal)
                .orElseGet(() -> userRepository.findByUsernameAndIsDeletedFalse(principal)
                        .orElseThrow(() -> new EntityNotFoundException("User not found: " + principal)));
        return leadService.getCustomerLeadByUserId(user.getId());
    }

    @PatchMapping("/lead/status")
    public LeadResponse updateCustomerLeadStatus(@Valid @RequestBody LeadUpdateStatusRequest request, Authentication authentication) {
        return leadService.updateCustomerLeadStatus(request, authentication.getName());
    }

    @PostMapping("/lead/payment")
    public LeadResponse recordCustomerPayment(@Valid @RequestBody PaymentRequest request, Authentication authentication) {
        return leadService.recordCustomerPayment(authentication.getName(), request);
    }

    @GetMapping("/chat/messages")
    public List<LeadChatMessageResponse> listCustomerChatMessages(Authentication authentication) {
        String principal = authentication.getName();
        User user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(principal)
                .orElseGet(() -> userRepository.findByUsernameAndIsDeletedFalse(principal)
                        .orElseThrow(() -> new EntityNotFoundException("User not found: " + principal)));
        LeadResponse lead = leadService.getCustomerLeadByUserId(user.getId());
        if (lead == null) {
            return List.of();
        }
        return leadChatService.listMessages(lead.getId(), LeadChatThreadType.CUSTOMER, principal);
    }

    @PostMapping("/chat/messages")
    public LeadChatMessageResponse sendCustomerChatMessage(
            @Valid @RequestBody LeadChatMessageRequest request,
            Authentication authentication) {
        String principal = authentication.getName();
        User user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(principal)
                .orElseGet(() -> userRepository.findByUsernameAndIsDeletedFalse(principal)
                        .orElseThrow(() -> new EntityNotFoundException("User not found: " + principal)));
        LeadResponse lead = leadService.getCustomerLeadByUserId(user.getId());
        if (lead == null) {
            throw new EntityNotFoundException("No lead associated with user");
        }
        return leadChatService.sendMessage(lead.getId(), request, principal);
    }

    @PostMapping(value = "/chat/messages/file", consumes = {"multipart/form-data"})
    public LeadChatMessageResponse sendCustomerChatAttachment(
            @RequestParam(value = "message", required = false) String message,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {
        String principal = authentication.getName();
        User user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(principal)
                .orElseGet(() -> userRepository.findByUsernameAndIsDeletedFalse(principal)
                        .orElseThrow(() -> new EntityNotFoundException("User not found: " + principal)));
        LeadResponse lead = leadService.getCustomerLeadByUserId(user.getId());
        if (lead == null) {
            throw new EntityNotFoundException("No lead associated with user");
        }
        return leadChatService.sendMessageWithFile(lead.getId(), "CUSTOMER", message, file, principal);
    }

    @GetMapping("/chat/messages/{messageId}/file")
    public ResponseEntity<Resource> downloadCustomerChatAttachment(@PathVariable("messageId") Long messageId, Authentication authentication) {
        String principal = authentication.getName();
        User user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(principal)
                .orElseGet(() -> userRepository.findByUsernameAndIsDeletedFalse(principal)
                        .orElseThrow(() -> new EntityNotFoundException("User not found: " + principal)));
        LeadResponse lead = leadService.getCustomerLeadByUserId(user.getId());
        if (lead == null) {
            throw new EntityNotFoundException("No lead associated with user");
        }
        var message = leadChatService.getChatAttachment(lead.getId(), messageId, principal);
        return buildChatAttachmentResponse(message);
    }

    @GetMapping("/chat/notifications")
    public List<ChatNotificationResponse> listCustomerChatNotifications(
            @RequestParam(value = "since", required = false) String since,
            Authentication authentication) {
        String principal = authentication.getName();
        User user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(principal)
                .orElseGet(() -> userRepository.findByUsernameAndIsDeletedFalse(principal)
                        .orElseThrow(() -> new EntityNotFoundException("User not found: " + principal)));
        LeadResponse lead = leadService.getCustomerLeadByUserId(user.getId());
        if (lead == null) {
            return List.of();
        }
        return leadChatService.listNotifications(List.of(lead.getId()), principal, since);
    }

    private ResponseEntity<Resource> buildChatAttachmentResponse(LeadChatMessage message) {
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
