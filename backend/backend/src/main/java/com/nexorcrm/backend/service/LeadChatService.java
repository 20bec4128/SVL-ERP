package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.LeadChatMessageRequest;
import com.nexorcrm.backend.dto.LeadChatMessageResponse;
import com.nexorcrm.backend.entity.*;
import com.nexorcrm.backend.repo.LeadChatMessageRepository;
import com.nexorcrm.backend.repo.LeadChatThreadRepository;
import com.nexorcrm.backend.repo.LeadRepository;
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
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeadChatService {

    private static final Logger log = LoggerFactory.getLogger(LeadChatService.class);
    private static final String LEADS_PAGE_KEY = "leads";
    private final LeadRepository leadRepository;
    private final LeadChatThreadRepository threadRepository;
    private final LeadChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserGroupRepository userGroupRepository;
    private final UserGroupMemberRepository userGroupMemberRepository;
    private final EmailNotificationService emailNotificationService;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public LeadChatService(LeadRepository leadRepository,
                           LeadChatThreadRepository threadRepository,
                           LeadChatMessageRepository messageRepository,
                           UserRepository userRepository,
                           UserGroupRepository userGroupRepository,
                           UserGroupMemberRepository userGroupMemberRepository,
                           EmailNotificationService emailNotificationService) {
        this.leadRepository = leadRepository;
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.userGroupRepository = userGroupRepository;
        this.userGroupMemberRepository = userGroupMemberRepository;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional(readOnly = true)
    public List<LeadChatMessageResponse> listMessages(Long leadId, LeadChatThreadType threadType, String actorPrincipal) {
        Lead lead = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        User actor = resolveActor(actorPrincipal);
        assertCanAccessThread(actor, lead, threadType);

        LeadChatThread thread = threadRepository.findByLead_IdAndThreadType(leadId, threadType)
                .orElse(null);
        if (thread == null) {
            return List.of();
        }
        return messageRepository.findByThread_IdOrderByCreatedAtAsc(thread.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public LeadChatMessageResponse sendMessage(Long leadId, LeadChatMessageRequest request, String actorPrincipal) {
        Lead lead = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        User actor = resolveActor(actorPrincipal);
        LeadChatThreadType threadType = parseThreadType(request.getThreadType());
        assertCanAccessThread(actor, lead, threadType);

        LeadChatThread thread = threadRepository.findByLead_IdAndThreadType(leadId, threadType)
                .orElseGet(() -> createThread(lead, threadType, actor));

        LeadChatMessage message = new LeadChatMessage();
        message.setThread(thread);
        message.setSenderUserId(actor.getId());
        message.setSenderRole(actor.getRole());
        message.setMessage(request.getMessage());
        message.setMessageType(LeadChatMessageType.TEXT);
        if (request.getDesignChoice() != null) {
            message.setDesignAction(request.getDesignChoice().getAction());
            message.setDesignComment(request.getDesignChoice().getComment());
        }
        LeadChatMessage saved = messageRepository.save(message);
        maybeSendEmailNotification(lead, threadType, actor, saved);
        return toResponse(saved);
    }

    public List<LeadChatMessageResponse> listCustomerMessages(String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("You do not have permission to access customer chat");
        }
        Lead lead = findCustomerLead(actor);
        return listMessages(lead.getId(), LeadChatThreadType.CUSTOMER, actorPrincipal);
    }

    public LeadChatMessageResponse sendCustomerMessage(LeadChatMessageRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("You do not have permission to access customer chat");
        }
        Lead lead = findCustomerLead(actor);
        request.setThreadType(LeadChatThreadType.CUSTOMER.name());
        return sendMessage(lead.getId(), request, actorPrincipal);
    }

    public LeadChatMessageResponse sendMessageWithFile(Long leadId,
                                                       String threadTypeValue,
                                                       String message,
                                                       MultipartFile file,
                                                       String actorPrincipal) {
        Lead lead = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        User actor = resolveActor(actorPrincipal);
        LeadChatThreadType threadType = parseThreadType(threadTypeValue);
        assertCanAccessThread(actor, lead, threadType);

        if ((file == null || file.isEmpty()) && !StringUtils.hasText(message)) {
            throw new IllegalStateException("Message or file is required");
        }

        LeadChatThread thread = threadRepository.findByLead_IdAndThreadType(leadId, threadType)
                .orElseGet(() -> createThread(lead, threadType, actor));

        LeadChatMessage chatMessage = new LeadChatMessage();
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

        LeadChatMessage saved = messageRepository.save(chatMessage);
        maybeSendEmailNotification(lead, threadType, actor, saved);
        return toResponse(saved);
    }

    public LeadChatMessageResponse sendCustomerMessageWithFile(String message,
                                                               MultipartFile file,
                                                               String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("You do not have permission to access customer chat");
        }
        Lead lead = findCustomerLead(actor);
        return sendMessageWithFile(lead.getId(),
                LeadChatThreadType.CUSTOMER.name(),
                message,
                file,
                actorPrincipal);
    }

    @Transactional(readOnly = true)
    public LeadChatMessage getChatAttachment(Long leadId, Long messageId, String actorPrincipal) {
        Lead lead = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        User actor = resolveActor(actorPrincipal);
        LeadChatMessage message = messageRepository.findByIdAndThread_Lead_Id(messageId, leadId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found"));
        LeadChatThreadType threadType = message.getThread() != null ? message.getThread().getThreadType() : null;
        if (threadType == null) {
            throw new EntityNotFoundException("Message not found");
        }
        assertCanAccessThread(actor, lead, threadType);
        return message;
    }

    @Transactional(readOnly = true)
    public LeadChatMessage getAttachmentByLead(Long leadId, Long messageId) {
        LeadChatMessage message = messageRepository.findByIdAndThread_Lead_Id(messageId, leadId)
                .orElseThrow(() -> new EntityNotFoundException("Message not found"));
        if (message.getThread() == null) {
            throw new EntityNotFoundException("Message not found");
        }
        return message;
    }

    @Transactional(readOnly = true)
    public LeadChatMessage getCustomerChatAttachment(Long messageId, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("You do not have permission to access customer chat");
        }
        Lead lead = findCustomerLead(actor);
        return getChatAttachment(lead.getId(), messageId, actorPrincipal);
    }

    @Transactional(readOnly = true)
    public List<com.nexorcrm.backend.dto.ChatNotificationResponse> listNotifications(List<Long> leadIds,
                                                                                      String actorPrincipal,
                                                                                      String sinceValue) {
        if (leadIds == null || leadIds.isEmpty()) {
            return List.of();
        }
        User actor = resolveActor(actorPrincipal);
        LocalDateTime since = parseSince(sinceValue);
        List<LeadChatMessage> rows = messageRepository.findRecentByLeadIds(leadIds, since);
        return rows.stream()
                .filter((message) -> message.getSenderUserId() == null
                        || !message.getSenderUserId().equals(actor.getId()))
                .filter((message) -> {
                    if (actor.getRole() == Role.MANAGER) {
                        return message.getSenderRole() == Role.EMPLOYEE;
                    }
                    return true;
                })
                .limit(10)
                .map((message) -> {
                    var res = new com.nexorcrm.backend.dto.ChatNotificationResponse();
                    res.setLeadId(message.getThread() != null && message.getThread().getLead() != null
                            ? message.getThread().getLead().getId()
                            : null);
                    res.setMessageId(message.getId());
                    res.setThreadType(message.getThread() != null && message.getThread().getThreadType() != null
                            ? message.getThread().getThreadType().name()
                            : null);
                    res.setMessage(message.getMessage());
                    res.setSenderRole(message.getSenderRole() != null ? message.getSenderRole().name() : null);
                    res.setCreatedAt(message.getCreatedAt());
                    return res;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.nexorcrm.backend.dto.ChatNotificationResponse> listCustomerNotifications(String actorPrincipal,
                                                                                             String sinceValue) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("You do not have permission to access customer chat");
        }
        Lead lead = findCustomerLead(actor);
        LocalDateTime since = parseSince(sinceValue);
        List<LeadChatMessage> rows = messageRepository.findRecentByLeadIds(List.of(lead.getId()), since);
        return rows.stream()
                .filter((message) -> message.getSenderUserId() == null
                        || !message.getSenderUserId().equals(actor.getId()))
                .limit(10)
                .map((message) -> {
                    var res = new com.nexorcrm.backend.dto.ChatNotificationResponse();
                    res.setLeadId(lead.getId());
                    res.setMessageId(message.getId());
                    res.setThreadType(message.getThread() != null && message.getThread().getThreadType() != null
                            ? message.getThread().getThreadType().name()
                            : null);
                    res.setMessage(message.getMessage());
                    res.setSenderRole(message.getSenderRole() != null ? message.getSenderRole().name() : null);
                    res.setCreatedAt(message.getCreatedAt());
                    return res;
                })
                .toList();
    }



    private LeadChatThread createThread(Lead lead, LeadChatThreadType threadType, User actor) {
        LeadChatThread thread = new LeadChatThread();
        thread.setLead(lead);
        thread.setThreadType(threadType);
        thread.setCreatedBy(actor != null ? actor.getEmail() : null);
        return threadRepository.save(thread);
    }

    private void assertCanAccessThread(User actor, Lead lead, LeadChatThreadType threadType) {
        if (actor.getRole() == Role.CUSTOMER) {
            if (threadType != LeadChatThreadType.CUSTOMER) {
                throw new AccessDeniedException("You do not have permission to access this chat");
            }
            if (!StringUtils.hasText(actor.getEmail())
                    || !StringUtils.hasText(lead.getEmailNormalized())
                    || !lead.getEmailNormalized().equals(actor.getEmail().trim().toLowerCase(Locale.ROOT))) {
                throw new AccessDeniedException("You do not have permission to access this chat");
            }
            return;
        }
        if (actor.getRole() == Role.EMPLOYEE) {
            if (lead.getOwnerUserId() == null || !lead.getOwnerUserId().equals(actor.getId())) {
                throw new AccessDeniedException("You do not have permission to access this chat");
            }
            if (threadType == LeadChatThreadType.CUSTOMER
                    && "rejected".equalsIgnoreCase(StringUtils.trimWhitespace(lead.getStatus()))) {
                throw new AccessDeniedException("Customer chat is closed for rejected leads");
            }
        }
        if (threadType == LeadChatThreadType.CUSTOMER) {
            return;
        }
        if (threadType == LeadChatThreadType.INTERNAL) {
            if (actor.getRole() == Role.SUPER_ADMIN) {
                return;
            }
            List<User> groupEmployees = loadGroupEmployees(lead);
            if (actor.getRole() == Role.MANAGER) {
                if (!isAssociatedManager(actor, groupEmployees)) {
                    throw new AccessDeniedException("You do not have permission to access this chat");
                }
                return;
            }
            if (actor.getRole() == Role.ADMIN) {
                if (!isAssociatedAdmin(actor, groupEmployees)) {
                    throw new AccessDeniedException("You do not have permission to access this chat");
                }
                return;
            }
            throw new AccessDeniedException("You do not have permission to access this chat");
        }
        throw new AccessDeniedException("You do not have permission to access this chat");
    }

    private List<User> loadGroupEmployees(Lead lead) {
        if (lead == null || lead.getAssignedGroupId() == null) {
            return List.of();
        }
        return userGroupRepository.findById(lead.getAssignedGroupId())
                .map(userGroupMemberRepository::findByGroupOrderByUserUsernameAsc)
                .orElse(List.of())
                .stream()
                .filter(this::memberHasLeadVisibility)
                .map(UserGroupMember::getUser)
                .filter(Objects::nonNull)
                .filter(User::isActive)
                .filter(user -> user.getActivationStatus() == ActivationStatus.ACTIVE)
                .filter(user -> user.getRole() == Role.EMPLOYEE)
                .toList();
    }

    private boolean memberHasLeadVisibility(UserGroupMember membership) {
        String pageKeysCsv = membership == null ? null : membership.getPageKeysCsv();
        if (!StringUtils.hasText(pageKeysCsv)) {
            return true;
        }
        return parseCsv(pageKeysCsv).stream()
                .anyMatch(value -> LEADS_PAGE_KEY.equalsIgnoreCase(value));
    }

    private boolean isAssociatedManager(User manager, List<User> groupEmployees) {
        if (manager == null || groupEmployees == null || manager.getRole() != Role.MANAGER) {
            return false;
        }
        return groupEmployees.stream().anyMatch(emp -> isSameTeamScope(emp, manager));
    }

    private boolean isAssociatedAdmin(User admin, List<User> groupEmployees) {
        if (admin == null || groupEmployees == null || admin.getRole() != Role.ADMIN) {
            return false;
        }
        return groupEmployees.stream().anyMatch(emp -> isSameDepartmentScope(emp, admin));
    }

    private boolean isSameTeamScope(User actor, User target) {
        if (actor == null || target == null) {
            return false;
        }
        if (!hasTeamScope(actor) || !hasTeamScope(target)) {
            return false;
        }
        return textEquals(actor.getInstitutionName(), target.getInstitutionName())
                && textEquals(actor.getDepartmentName(), target.getDepartmentName())
                && textEquals(actor.getTeamName(), target.getTeamName());
    }

    private boolean isSameDepartmentScope(User actor, User target) {
        if (actor == null || target == null) {
            return false;
        }
        if (!hasDepartmentScope(actor) || !hasDepartmentScope(target)) {
            return false;
        }
        return textEquals(actor.getInstitutionName(), target.getInstitutionName())
                && textEquals(actor.getDepartmentName(), target.getDepartmentName());
    }

    private boolean hasTeamScope(User user) {
        return hasDepartmentScope(user) && StringUtils.hasText(user.getTeamName());
    }

    private boolean hasDepartmentScope(User user) {
        return user != null
                && StringUtils.hasText(user.getInstitutionName())
                && StringUtils.hasText(user.getDepartmentName());
    }

    private boolean textEquals(String a, String b) {
        return normalizeNullable(a) != null && normalizeNullable(a).equalsIgnoreCase(StringUtils.hasText(b) ? b.trim() : "");
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) return null;
        return value.trim();
    }

    private List<String> parseCsv(String csv) {
        if (!StringUtils.hasText(csv)) {
            return List.of();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());
    }

    private LeadChatThreadType parseThreadType(String value) {
        try {
            return LeadChatThreadType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid thread type");
        }
    }

    private LeadChatMessageResponse toResponse(LeadChatMessage message) {
        LeadChatMessageResponse res = new LeadChatMessageResponse();
        res.setId(message.getId());
        res.setThreadId(message.getThread() != null ? message.getThread().getId() : null);
        res.setSenderUserId(message.getSenderUserId());
        res.setSenderRole(message.getSenderRole() != null ? message.getSenderRole().name() : null);
        res.setMessage(message.getMessage());
        res.setMessageType(message.getMessageType() != null ? message.getMessageType().name() : null);
        res.setAttachmentName(message.getAttachmentName());
        res.setAttachmentType(message.getAttachmentType());
        res.setAttachmentSize(message.getAttachmentSize());
        res.setDesignChoice(message.getDesignAction() != null ? new com.nexorcrm.backend.dto.DesignChoice() : null);
        if (res.getDesignChoice() != null) {
            res.getDesignChoice().setAction(message.getDesignAction());
            res.getDesignChoice().setComment(message.getDesignComment());
        }
        res.setCreatedAt(message.getCreatedAt());
        return res;
    }

    private void applyAttachment(LeadChatMessage message, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }
        try {
            Path dir = Path.of(uploadDir, "chat");
            Files.createDirectories(dir);
            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf('.'));
            }
            String storedName = "chat_" + UUID.randomUUID().toString().replace("-", "") + ext;
            Path target = dir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            message.setAttachmentName(originalName);
            message.setAttachmentPath(target.toString());
            message.setAttachmentType(file.getContentType());
            message.setAttachmentSize(file.getSize());
        } catch (IOException ex) {
            throw new RuntimeException("Chat attachment upload failed", ex);
        }
    }

    private void maybeSendEmailNotification(Lead lead,
                                            LeadChatThreadType threadType,
                                            User sender,
                                            LeadChatMessage message) {
        if (lead == null || sender == null || threadType != LeadChatThreadType.CUSTOMER) {
            log.debug("Email notification skipped: lead={}, sender={}, threadType={}",
                    lead != null ? lead.getId() : null,
                    sender != null ? sender.getId() : null,
                    threadType);
            return;
        }

        if (sender.getRole() == Role.CUSTOMER) {
            if (lead.getOwnerUserId() == null) return;
            userRepository.findById(lead.getOwnerUserId()).ifPresent(owner -> {
                if (!shouldSendForUser(owner)) {
                    log.info("Email notification skipped for owner {} due to recent login.", owner.getId());
                    return;
                }
                String subject = "New customer message";
                String body = "You have a new customer message in SVL CRM.\n" +
                        "Please login to view the chat.";
                emailNotificationService.notifyIfAllowed(owner.getEmail(), subject, body);
            });
            return;
        }

        if (!StringUtils.hasText(lead.getEmail())) {
            log.warn("Email notification skipped: lead email missing for lead {}", lead.getId());
            return;
        }
        userRepository.findByEmailAndIsDeletedFalse(lead.getEmail().trim().toLowerCase(Locale.ROOT)).ifPresent(customer -> {
            if (!shouldSendForUser(customer)) {
                log.info("Email notification skipped for customer {} due to recent login.", customer.getId());
                return;
            }
            String subject = "New message from SVL";
            String body = "You have a new message regarding your enquiry.\n" +
                    "Please login to view the chat.";
            emailNotificationService.notifyIfAllowed(customer.getEmail(), subject, body);
        });
    }

    private boolean shouldSendForUser(User user) {
        if (user == null) return false;
        if (user.getLastLoginAt() == null) return true;
        return java.time.Duration.between(user.getLastLoginAt(), java.time.LocalDateTime.now()).toMinutes() > 10;
    }

    private LocalDateTime parseSince(String value) {
        if (!StringUtils.hasText(value)) {
            return LocalDateTime.now();
        }
        try {
            Instant instant = Instant.parse(value.trim());
            return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
        } catch (Exception ignore) {
            return LocalDateTime.now();
        }
    }

    private User resolveActor(String principal) {
        if (!StringUtils.hasText(principal)) {
            throw new EntityNotFoundException("Actor not found");
        }
        if (principal.contains("@")) {
            return userRepository.findByEmailAndIsDeletedFalse(principal.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
        }
        return userRepository.findByUsernameAndIsDeletedFalse(principal.trim())
                .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
    }

    private Lead findCustomerLead(User actor) {
        String email = actor.getEmail() == null ? "" : actor.getEmail().trim().toLowerCase(Locale.ROOT);
        return leadRepository.findTopByDeletedFalseAndEmailNormalizedOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
    }
}
