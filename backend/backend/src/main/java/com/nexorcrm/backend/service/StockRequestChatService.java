package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.StockRequestChatMessageRequest;
import com.nexorcrm.backend.dto.StockRequestChatMessageResponse;
import com.nexorcrm.backend.entity.*;
import com.nexorcrm.backend.repo.StockRequestChatMessageRepository;
import com.nexorcrm.backend.repo.StockRequestChatThreadRepository;
import com.nexorcrm.backend.repo.StockRequestRepository;
import com.nexorcrm.backend.repo.UserGroupMemberRepository;
import com.nexorcrm.backend.repo.UserGroupRepository;
import com.nexorcrm.backend.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional
public class StockRequestChatService {

    private static final Logger log = LoggerFactory.getLogger(StockRequestChatService.class);
    private final StockRequestRepository requestRepository;
    private final StockRequestChatThreadRepository threadRepository;
    private final StockRequestChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserGroupRepository userGroupRepository;
    private final UserGroupMemberRepository userGroupMemberRepository;
    private final EmailNotificationService emailNotificationService;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public StockRequestChatService(StockRequestRepository requestRepository,
                                   StockRequestChatThreadRepository threadRepository,
                                   StockRequestChatMessageRepository messageRepository,
                                   UserRepository userRepository,
                                   UserGroupRepository userGroupRepository,
                                   UserGroupMemberRepository userGroupMemberRepository,
                                   EmailNotificationService emailNotificationService) {
        this.requestRepository = requestRepository;
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.userGroupRepository = userGroupRepository;
        this.userGroupMemberRepository = userGroupMemberRepository;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional(readOnly = true)
    public List<StockRequestChatMessageResponse> listMessages(Long requestId, String actorPrincipal) {
        StockRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        User actor = resolveActor(actorPrincipal);
        assertCanAccess(actor, req);

        StockRequestChatThread thread = threadRepository.findByStockRequest_Id(requestId).orElse(null);
        if (thread == null) {
            return List.of();
        }
        return messageRepository.findByThread_IdOrderByCreatedAtAsc(thread.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public StockRequestChatMessageResponse sendMessage(Long requestId, StockRequestChatMessageRequest request, String actorPrincipal) {
        StockRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        User actor = resolveActor(actorPrincipal);
        assertCanAccess(actor, req);

        StockRequestChatThread thread = threadRepository.findByStockRequest_Id(requestId)
                .orElseGet(() -> createThread(req, actor));

        StockRequestChatMessage message = new StockRequestChatMessage();
        message.setThread(thread);
        message.setSenderUserId(actor.getId());
        message.setSenderRole(actor.getRole());
        message.setMessage(request.getMessage());
        message.setMessageType(LeadChatMessageType.TEXT);
        StockRequestChatMessage saved = messageRepository.save(message);
        // notifications could be implemented here
        return toResponse(saved);
    }

    public StockRequestChatMessageResponse sendMessageWithFile(Long requestId,
                                                               String message,
                                                               MultipartFile file,
                                                               String actorPrincipal) {
        StockRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        User actor = resolveActor(actorPrincipal);
        assertCanAccess(actor, req);

        if ((file == null || file.isEmpty()) && !StringUtils.hasText(message)) {
            throw new IllegalStateException("Message or file is required");
        }

        StockRequestChatThread thread = threadRepository.findByStockRequest_Id(requestId)
                .orElseGet(() -> createThread(req, actor));

        StockRequestChatMessage chatMessage = new StockRequestChatMessage();
        chatMessage.setThread(thread);
        chatMessage.setSenderUserId(actor.getId());
        chatMessage.setSenderRole(actor.getRole());
        chatMessage.setMessage(StringUtils.hasText(message) ? message : "");
        chatMessage.setMessageType(file != null && !file.isEmpty()
                ? LeadChatMessageType.FILE
                : LeadChatMessageType.TEXT);
        if (file != null && !file.isEmpty()) {
            applyAttachment(chatMessage, file);
        }
        StockRequestChatMessage saved = messageRepository.save(chatMessage);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public StockRequestChatMessage getChatAttachment(Long requestId, Long messageId, String actorPrincipal) {
        StockRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        User actor = resolveActor(actorPrincipal);
        StockRequestChatMessage message = messageRepository.findByIdAndThread_StockRequest_Id(messageId, requestId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found"));
        assertCanAccess(actor, req);
        return message;
    }

    private StockRequestChatMessageResponse toResponse(StockRequestChatMessage m) {
        StockRequestChatMessageResponse r = new StockRequestChatMessageResponse();
        r.setId(m.getId());
        r.setThreadId(m.getThread() != null ? m.getThread().getId() : null);
        r.setSenderUserId(m.getSenderUserId());
        if (m.getSenderUserId() != null) {
            userRepository.findById(m.getSenderUserId()).ifPresent(u -> r.setSenderUserName(u.getUsername()));
        }
        r.setSenderRole(m.getSenderRole() != null ? m.getSenderRole().name() : null);
        r.setMessage(m.getMessage());
        r.setMessageType(m.getMessageType() != null ? m.getMessageType().name() : null);
        r.setAttachmentName(m.getAttachmentName());
        r.setAttachmentType(m.getAttachmentType());
        r.setAttachmentSize(m.getAttachmentSize());
        r.setCreatedAt(m.getCreatedAt());
        return r;
    }

    private StockRequestChatThread createThread(StockRequest req, User actor) {
        StockRequestChatThread thread = new StockRequestChatThread();
        thread.setStockRequest(req);
        if (actor != null) {
            thread.setCreatedBy(actor.getUsername());
        }
        return threadRepository.save(thread);
    }

    private void applyAttachment(StockRequestChatMessage chatMessage, MultipartFile file) {
        try {
            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path dest = Path.of(uploadDir).resolve(filename);
            Files.createDirectories(dest.getParent());
            try (var in = file.getInputStream()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            }
            chatMessage.setAttachmentName(file.getOriginalFilename());
            chatMessage.setAttachmentPath(dest.toString());
            chatMessage.setAttachmentType(file.getContentType());
            chatMessage.setAttachmentSize(file.getSize());
        } catch (IOException e) {
            log.error("failed to store chat attachment", e);
        }
    }

    private User resolveActor(String principal) {
        if (principal == null) return null;
        principal = principal.trim();
        User u = null;
        if (principal.contains("@")) {
            u = userRepository.findByEmailAndIsDeletedFalse(principal.toLowerCase()).orElse(null);
        } else {
            u = userRepository.findByUsernameAndIsDeletedFalse(principal).orElse(null);
        }
        return u;
    }

    private void assertCanAccess(User actor, StockRequest req) {
        // basic permission: production or account or admin can access
        if (actor == null) throw new AccessDeniedException("Not authenticated");
        Role role = actor.getRole();
        if (role == Role.SUPER_ADMIN || role == Role.ADMIN || role == Role.MANAGER) return;
        if (role == Role.EMPLOYEE) {
            // if owner of lead or requestedBy or assignedTo
            if (req.getRequestedBy() != null && req.getRequestedBy().equals(actor.getId())) return;
            if (req.getAssignedTo() != null && req.getAssignedTo().equals(actor.getId())) return;
            if (req.getLead() != null && req.getLead().getOwnerUserId() != null && req.getLead().getOwnerUserId().equals(actor.getId())) return;
        }
        throw new AccessDeniedException("You do not have permission to access this chat");
    }
}
