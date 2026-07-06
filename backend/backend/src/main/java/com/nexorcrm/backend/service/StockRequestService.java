package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.StockRequestRequest;
import com.nexorcrm.backend.dto.StockRequestResponse;
import com.nexorcrm.backend.entity.Deal;
import com.nexorcrm.backend.entity.Lead;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.StockRequest;
import com.nexorcrm.backend.entity.StockRequestLog;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.entity.UserGroupMember;
import com.nexorcrm.backend.entity.ActivationStatus;
import com.nexorcrm.backend.repo.DealRepository;
import com.nexorcrm.backend.repo.LeadRepository;
import com.nexorcrm.backend.repo.StockRequestRepository;
import com.nexorcrm.backend.repo.StockRequestLogRepository;
import com.nexorcrm.backend.repo.StockRequestChatMessageRepository;
import com.nexorcrm.backend.repo.StockRequestChatThreadRepository;
import com.nexorcrm.backend.repo.UserGroupMemberRepository;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.service.LeadFlowService;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

@Service
@Transactional
public class StockRequestService {
    private final StockRequestRepository repo;
    private final StockRequestLogRepository logRepository;
    private final LeadRepository leadRepository;
    private final DealRepository dealRepository;
    private final LeadFlowService leadFlowService;
    private final UserGroupMemberRepository userGroupMemberRepository;
    private final UserRepository userRepository;
    private final StockRequestChatThreadRepository threadRepository;
    private final StockRequestChatMessageRepository messageRepository;
    private final ConcurrentMap<Long, String> userNameCache = new ConcurrentHashMap<>();

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public StockRequestService(StockRequestRepository repo,
                               StockRequestLogRepository logRepository,
                               LeadRepository leadRepository,
                               DealRepository dealRepository,
                               LeadFlowService leadFlowService,
                               UserGroupMemberRepository userGroupMemberRepository,
                               UserRepository userRepository,
                               StockRequestChatThreadRepository threadRepository,
                               StockRequestChatMessageRepository messageRepository) {
        this.repo = repo;
        this.logRepository = logRepository;
        this.leadRepository = leadRepository;
        this.dealRepository = dealRepository;
        this.leadFlowService = leadFlowService;
        this.userGroupMemberRepository = userGroupMemberRepository;
        this.userRepository = userRepository;
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional(readOnly = true)
    public List<StockRequestResponse> list(String principal, Long leadId, Long requestedBy, Long assignedTo, String status) {
        User actor = resolveActor(principal);
        List<StockRequest> rows;
        if (leadId != null) {
            rows = repo.findByLead_Id(leadId);
        } else if (requestedBy != null) {
            rows = repo.findByRequestedBy(requestedBy);
        } else if (assignedTo != null) {
            rows = repo.findByAssignedTo(assignedTo);
        } else if (StringUtils.hasText(status)) {
            rows = repo.findByStatus(status);
        } else {
            rows = repo.findAll();
        }
        if (actor != null && actor.getRole() == Role.EMPLOYEE) {
            rows = rows.stream()
                    .filter(r ->
                            Objects.equals(r.getRequestedBy(), actor.getId())
                                    || Objects.equals(r.getAssignedTo(), actor.getId()))
                    .collect(Collectors.toList());
        }
        return rows.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StockRequestResponse getById(Long id, String principal) {
        StockRequest r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        User actor = resolveActor(principal);
        if (actor != null) {
            Role role = actor.getRole();
            if (role == Role.SUPER_ADMIN || role == Role.ADMIN || role == Role.MANAGER) {
                return toResponse(r);
            }
            if (role == Role.EMPLOYEE
                    && (Objects.equals(r.getRequestedBy(), actor.getId())
                    || Objects.equals(r.getAssignedTo(), actor.getId()))) {
                return toResponse(r);
            }
        }
        throw new AccessDeniedException("You do not have permission to access this stock request");
    }

    public StockRequestResponse create(StockRequestRequest req, String actor) {
        StockRequest r = new StockRequest();
        r.setDealId(req.getDealId());
        
        // Resolve lead from leadId or dealId
        Lead lead = null;
        if (req.getLeadId() != null) {
            lead = leadRepository.findById(req.getLeadId()).orElse(null);
        } else if (req.getDealId() != null) {
            // Try to find deal and get its source lead
            Deal deal = dealRepository.findById(req.getDealId()).orElse(null);
            if (deal != null && deal.getSourceLeadId() != null) {
                lead = leadRepository.findById(deal.getSourceLeadId()).orElse(null);
            }
        }
        
        if (lead != null) {
            r.setLead(lead);
        }
        
        // the requester should always be whoever currently owns the lead
        // (production employee) rather than the authenticated user.  the
        // frontend may still send the user id, but we ignore it to avoid
        // confusion when an admin creates a request on behalf of someone else.
        Long leadOwner = lead != null ? lead.getOwnerUserId() : null;
        if (leadOwner != null) {
            r.setRequestedBy(leadOwner);
        } else {
            // fall back to whatever the client sent (should rarely occur)
            r.setRequestedBy(req.getRequestedBy());
        }
        
        // if caller provided an explicit assignee, honour it; otherwise
        // pick one automatically using the configured handled-by group
        // (prefer "Stock Request", fallback to "Accounts").
        if (req.getAssignedTo() != null) {
            r.setAssignedTo(req.getAssignedTo());
        } else {
            Long picked = pickStockRequestAssignee();
            if (picked != null) r.setAssignedTo(picked);
        }

        // We don't use "Pending" in this project; always default to "Stock Request"
        // unless the caller explicitly sets a non-blank, non-pending value.
        String incomingStatus = req.getStatus();
        if (!StringUtils.hasText(incomingStatus) || "pending".equalsIgnoreCase(incomingStatus.trim())) {
            r.setStatus("Stock Request");
        } else {
            r.setStatus(incomingStatus.trim());
        }
        r.setItems(req.getItems());
        r.setPurchaseValue(req.getPurchaseValue());
        r.setVendorId(req.getVendorId());
        r.setBudgetExceeded(req.getBudgetExceeded() != null ? req.getBudgetExceeded() : false);
        r = repo.save(r);
        // log creation
        saveLog(r, "Created", actor);
        // update lead status directly (skipping flow validation)
        if (lead != null) {
            lead.setStatus("Stock Request");
            leadRepository.save(lead);
        }
        return toResponse(r);
    }

    public StockRequestResponse update(Long id, StockRequestRequest req, String actor) {
        StockRequest r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        if (req.getAssignedTo() != null) r.setAssignedTo(req.getAssignedTo());
        if (req.getStatus() != null) {
            r.setStatus(req.getStatus());
            // whenever the status moves into the accounts funnel we
            // ensure the assigned employee is recalculated unless caller
            // explicitly provided one.
            if (req.getAssignedTo() == null
                    && ("accounts".equalsIgnoreCase(req.getStatus())
                        || "accounts review".equalsIgnoreCase(req.getStatus()))) {
                Long acct = pickStockRequestAssignee();
                if (acct != null) {
                    r.setAssignedTo(acct);
                }
            }
        }
        if (req.getItems() != null) r.setItems(req.getItems());
        if (req.getPurchaseValue() != null) r.setPurchaseValue(req.getPurchaseValue());
        if (req.getVendorId() != null) r.setVendorId(req.getVendorId());
        if (req.getBudgetExceeded() != null) r.setBudgetExceeded(req.getBudgetExceeded());
        r = repo.save(r);
        // basic logging: record any status, assignee, vendor or value change
        saveLog(r, "Updated", actor);
        return toResponse(r);
    }

    public void delete(Long id) {
        StockRequest r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        threadRepository.findByStockRequest_Id(id).ifPresent((thread) -> {
            var messages = messageRepository.findByThread_IdOrderByCreatedAtAsc(thread.getId());
            if (!messages.isEmpty()) {
                messageRepository.deleteAll(messages);
            }
            threadRepository.delete(thread);
        });
        repo.delete(r);
    }

    private StockRequestResponse toResponse(StockRequest r) {
        StockRequestResponse out = new StockRequestResponse();
        out.setId(r.getId());
        out.setDealId(r.getDealId());
        out.setLeadId(r.getLead() != null ? r.getLead().getId() : null);
        out.setLeadDisplayId(r.getLead() != null ? r.getLead().getLeadId() : null);
        out.setLeadName(r.getLead() != null ? r.getLead().getName() : null);
        out.setRequestedBy(r.getRequestedBy());
        out.setRequestedByName(lookupUserName(r.getRequestedBy()));
        out.setAssignedTo(r.getAssignedTo());
        out.setAssignedToName(lookupUserName(r.getAssignedTo()));
        out.setStatus(r.getStatus());
        out.setItems(r.getItems());
        out.setPurchaseValue(r.getPurchaseValue());
        out.setVendorId(r.getVendorId());
        out.setBudgetExceeded(r.getBudgetExceeded());
        out.setBillFileName(r.getBillFileName());
        out.setBillFilePath(r.getBillFilePath());
        out.setBillNote(r.getBillNote());
        out.setBillUploadedAt(r.getBillUploadedAt());
        out.setCreatedAt(r.getCreatedAt());
        out.setUpdatedAt(r.getUpdatedAt());
        return out;
    }

    public StockRequestResponse uploadBill(Long id, MultipartFile file, String note, String actor) {
        StockRequest r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        if (file != null && !file.isEmpty()) {
            try {
                String originalName = StringUtils.cleanPath(
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "bill");
                String filename = UUID.randomUUID() + "_" + originalName;
                Path dir = Paths.get(uploadDir, "stock-bills").toAbsolutePath().normalize();
                Files.createDirectories(dir);
                Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
                r.setBillFileName(originalName);
                r.setBillFilePath("uploads/stock-bills/" + filename);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save bill file", e);
            }
        }
        if (note != null) r.setBillNote(note.trim());
        r.setBillUploadedAt(LocalDateTime.now());
        r.setStatus("Verification");
        r = repo.save(r);
        saveLog(r, "Bill uploaded - status set to Verification (pending review)", actor);
        return toResponse(r);
    }

    public StockRequestResponse verifyBill(Long id, String actor) {
        StockRequest r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        r.setStatus("Verified");
        r = repo.save(r);
        saveLog(r, "Bill verified - status set to Verified", actor);
        return toResponse(r);
    }

    public StockRequestResponse closeRequest(Long id, String actor) {
        StockRequest r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        r.setStatus("Closed");
        r = repo.save(r);
        saveLog(r, "Request closed", actor);
        return toResponse(r);
    }

    public Resource getBillResource(Long id) {
        StockRequest r = repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Stock request not found"));
        if (r.getBillFilePath() == null || r.getBillFilePath().isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "No bill uploaded");
        }
        Path path = Paths.get(r.getBillFilePath()).toAbsolutePath().normalize();
        if (!path.toFile().exists()) {
            // try relative to uploadDir
            path = Paths.get(uploadDir).resolve(
                    r.getBillFilePath().replaceFirst("^uploads/", "")).toAbsolutePath().normalize();
        }
        Resource resource = new FileSystemResource(path);
        if (!resource.exists() || !resource.isReadable()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Bill file not found");
        }
        return resource;
    }

    private String lookupUserName(Long userId) {
        if (userId == null) {
            return null;
        }
        return userNameCache.computeIfAbsent(userId, this::resolveUserName);
    }

    /* log helpers */
    private void saveLog(StockRequest r, String action, String actor) {
        try {
            StockRequestLog entry = new StockRequestLog();
            entry.setStockRequest(r);
            entry.setAction(action);
            // resolve actor username/email to user display name
            String actorName = actor != null ? resolveActorName(actor) : "Unknown";
            entry.setActor(actorName);
            logRepository.save(entry);
        } catch (Exception ex) {
            // swallow: logging should not break main flow
            System.err.println("failed to save stock request log: " + ex.getMessage());
        }
    }

    private String resolveActorName(String username) {
        if (!StringUtils.hasText(username)) {
            return "Unknown";
        }
        try {
            // try username first, then email (case-insensitive, not deleted)
            Optional<User> user = userRepository.findByUsernameIgnoreCaseAndIsDeletedFalse(username);
            if (user.isEmpty()) {
                user = userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(username);
            }
            if (user.isPresent()) return formatUser(user.get());
            // fallback to the username itself
            return username;
        } catch (Exception ex) {
            System.err.println("failed to resolve actor name: " + ex.getMessage());
            return username;
        }
    }

    private User resolveActor(String principal) {
        if (!StringUtils.hasText(principal)) {
            return null;
        }
        return userRepository.findByUsernameIgnoreCaseAndIsDeletedFalse(principal)
                .or(() -> userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(principal))
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<StockRequestLog> getLogs(Long requestId) {
        return logRepository.findByStockRequest_IdOrderByCreatedAtAsc(requestId);
    }

    private String resolveUserName(Long userId) {
        return userRepository.findById(userId)
                .map(this::formatUser)
                .orElse(null);
    }

    private String formatUser(User user) {
        if (user == null) {
            return null;
        }
        String first = StringUtils.hasText(user.getFirstName()) ? user.getFirstName().trim() : "";
        String last = StringUtils.hasText(user.getLastName()) ? user.getLastName().trim() : "";
        StringBuilder sb = new StringBuilder();
        if (!first.isEmpty()) {
            sb.append(first);
        }
        if (!last.isEmpty()) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(last);
        }
        if (sb.length() > 0) {
            return sb.toString();
        }
        return StringUtils.hasText(user.getUsername()) ? user.getUsername().trim() : null;
    }

    /**
     * Look up the flow configuration for the 'Accounts' status and return
     * the handled-by group id, or null if there is no rule.
     */
    private Long getHandledByGroupIdForStatus(String statusName) {
        if (!StringUtils.hasText(statusName)) return null;
        try {
            var flow = leadFlowService.getFlow();
            if (flow == null || flow.getRules() == null) return null;
            var rules = flow.getRules();
            for (var raw : rules) {
                if (raw == null) continue;
                Object status = raw.get("status");
                if (status != null && statusName.equalsIgnoreCase(status.toString().trim())) {
                    Object gid = raw.get("handledByGroupId");
                    if (gid instanceof Number) return ((Number) gid).longValue();
                    if (gid != null) {
                        try {
                            return Long.parseLong(gid.toString().trim());
                        } catch (Exception ignore) {
                        }
                    }
                }
            }
        } catch (Exception ignore) {
        }
        return null;
    }

    /**
     * Choose an employee from the accounts group using a simple round‑robin
     * algorithm.  Returns null if no eligible user could be found.
     */
    private Long pickStockRequestAssignee() {
        // prefer stock request handler, fallback to accounts handler
        Long groupId = getHandledByGroupIdForStatus("Stock Request");
        if (groupId == null) groupId = getHandledByGroupIdForStatus("Stock Requested");
        if (groupId == null) groupId = getHandledByGroupIdForStatus("Accounts");
        if (groupId == null) return null;

        List<User> candidates = userGroupMemberRepository
                .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                        groupId, Role.EMPLOYEE, ActivationStatus.ACTIVE)
                .stream()
                .map(UserGroupMember::getUser)
                .filter(Objects::nonNull)
                .filter(user -> user.isActive() && user.getActivationStatus() == ActivationStatus.ACTIVE)
                .collect(Collectors.toList());
        if (candidates.isEmpty()) {
            return null;
        }
        List<Long> ids = candidates.stream().map(User::getId).collect(Collectors.toList());
        Optional<StockRequest> lastOpt = repo.findTopByAssignedToInOrderByCreatedAtDesc(ids);
        if (lastOpt.isEmpty() || lastOpt.get().getAssignedTo() == null) {
            return candidates.get(0).getId();
        }
        Long last = lastOpt.get().getAssignedTo();
        int index = -1;
        for (int i = 0; i < candidates.size(); i++) {
            if (Objects.equals(candidates.get(i).getId(), last)) {
                index = i;
                break;
            }
        }
        int next = (index + 1) % candidates.size();
        return candidates.get(next).getId();
    }
}
