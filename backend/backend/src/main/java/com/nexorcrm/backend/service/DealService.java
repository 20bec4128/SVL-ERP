package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.DealResponse;
import com.nexorcrm.backend.dto.LeadUpdateDetailsRequest;
import com.nexorcrm.backend.dto.LeadFlowResponse;
import com.nexorcrm.backend.entity.ActivationStatus;
import com.nexorcrm.backend.entity.Deal;
import com.nexorcrm.backend.entity.Lead;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.entity.UserGroup;
import com.nexorcrm.backend.entity.UserGroupMember;
import com.nexorcrm.backend.repo.DealRepository;
import com.nexorcrm.backend.repo.LeadLogRepository;
import com.nexorcrm.backend.repo.LeadRepository;
import com.nexorcrm.backend.repo.UserGroupMemberRepository;
import com.nexorcrm.backend.repo.UserGroupRepository;
import com.nexorcrm.backend.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import com.nexorcrm.backend.util.StatusRequirementTypeFilter;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class DealService {

    private static final Logger logger = LoggerFactory.getLogger(DealService.class);
    private static final Set<String> DEAL_RECORD_PAGE_KEYS = Set.of("deals", "design", "production");

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    private final DealRepository dealRepository;
    private final LeadLogRepository leadLogRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final DealFlowService dealFlowService;
    private final LeadFlowService leadFlowService;
    private final UserGroupRepository userGroupRepository;
    private final UserGroupMemberRepository userGroupMemberRepository;

    public DealService(DealRepository dealRepository,
                       LeadLogRepository leadLogRepository,
                       LeadRepository leadRepository,
                       UserRepository userRepository,
                       DealFlowService dealFlowService,
                       LeadFlowService leadFlowService,
                       UserGroupRepository userGroupRepository,
                       UserGroupMemberRepository userGroupMemberRepository) {
        this.dealRepository = dealRepository;
        this.leadLogRepository = leadLogRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.dealFlowService = dealFlowService;
        this.leadFlowService = leadFlowService;
        this.userGroupRepository = userGroupRepository;
        this.userGroupMemberRepository = userGroupMemberRepository;
    }

    /**
     * Creates a deal record the first time a lead transitions to "deal" status.
     * If a deal already exists for this lead, updates the snapshot fields.
     */
    public void createOrUpdateFromLead(Lead lead, Long convertedByUserId) {
        if (lead == null) return;
        Deal deal = dealRepository.findBySourceLeadIdAndDeletedFalse(lead.getId())
                .or(() -> dealRepository.findFirstBySourceLeadIdOrderByIdDesc(lead.getId()))
                .orElse(new Deal());
        deal.setDeleted(false);
        User convertedOwner = null;
        if ("Deal".equalsIgnoreCase(StringUtils.hasText(lead.getStatus()) ? lead.getStatus().trim() : "")) {
            convertedOwner = resolveDealConversionOwnerForLead(lead.getId(), lead.getOwnerUserId());
        }
        deal.setSourceLeadId(lead.getId());
        String dealName = StringUtils.hasText(lead.getName())
                ? lead.getName().trim()
                : (StringUtils.hasText(lead.getLeadId()) ? lead.getLeadId().trim() : "Lead " + lead.getId());
        deal.setName(dealName);
        deal.setEmail(lead.getEmail());
        deal.setMobile(lead.getMobile());
        deal.setCountryCode(lead.getCountryCode());
        deal.setPrimarySource(lead.getPrimarySource());
        deal.setSecondarySource(lead.getSecondarySource());
        deal.setTertiarySource(lead.getTertiarySource());
        deal.setProjectName(lead.getProjectName());
        deal.setCompanyName(lead.getCompanyName());
        deal.setOwner(lead.getOwner());
        if (convertedOwner != null) {
            String convertedOwnerName = buildUserDisplayName(convertedOwner);
            deal.setOwner(StringUtils.hasText(convertedOwnerName) ? convertedOwnerName : lead.getOwner());
            deal.setOwnerUserId(convertedOwner.getId());
        } else {
            deal.setOwnerUserId(lead.getOwnerUserId());
        }
        if (convertedByUserId != null) {
            deal.setConvertedByUserId(convertedByUserId);
        }
        deal.setTotalAmount(lead.getTotalAmount());
        deal.setPaidAmount(lead.getPaidAmount());
        deal.setRemainingAmount(lead.getRemainingAmount());
        deal.setInvoiceData(lead.getInvoiceData());
        deal.setInvoiceCgstPercent(lead.getInvoiceCgstPercent());
        deal.setInvoiceSgstPercent(lead.getInvoiceSgstPercent());
        deal.setBudgetInvoiceSent(lead.isBudgetInvoiceSent());
        deal.setPaymentInvoiceSent(lead.isPaymentInvoiceSent());
        deal.setStatus(StringUtils.hasText(lead.getStatus()) ? lead.getStatus().trim() : "Deal");
        deal.setRequirementFileName(lead.getRequirementFileName());
        deal.setRequirementFilePath(lead.getRequirementFilePath());
        deal.setRequirementType(lead.getRequirementType());
        deal.setRequirementNotes(lead.getRequirementNotes());
        if (deal.getConvertedAt() == null) {
            deal.setConvertedAt(LocalDateTime.now());
        }
        dealRepository.save(deal);
    }

    private User resolveDealConversionOwnerForLead(Long sourceLeadId, Long fallbackOwnerUserId) {
        try {
            var flowResponse = dealFlowService.getFlow();
            List<Map<String, Object>> rules = flowResponse.getRules();
            if (rules == null || rules.isEmpty()) {
                return fallbackOwnerUserId == null ? null : userRepository.findByIdAndIsDeletedFalse(fallbackOwnerUserId).orElse(null);
            }

            Long handledByGroupId = null;
            for (Map<String, Object> rule : rules) {
                if (rule == null) continue;
                Object statusVal = rule.get("status");
                if (statusVal != null && statusVal.toString().trim().equalsIgnoreCase("Deal")) {
                    Object groupIdVal = rule.get("handledByGroupId");
                    if (groupIdVal != null) {
                        handledByGroupId = Long.parseLong(groupIdVal.toString());
                        break;
                    }
                }
            }

            if (handledByGroupId == null) {
                return fallbackOwnerUserId == null ? null : userRepository.findByIdAndIsDeletedFalse(fallbackOwnerUserId).orElse(null);
            }

            List<UserGroupMember> eligibleMembers = userGroupMemberRepository
                    .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                            handledByGroupId, Role.EMPLOYEE, ActivationStatus.ACTIVE)
                    .stream()
                    .filter(m -> m.getUser() != null)
                    .toList();

            if (eligibleMembers.isEmpty()) {
                return fallbackOwnerUserId == null ? null : userRepository.findByIdAndIsDeletedFalse(fallbackOwnerUserId).orElse(null);
            }

            List<User> candidates = eligibleMembers.stream()
                    .map(UserGroupMember::getUser)
                    .filter(Objects::nonNull)
                    .toList();
            Set<Long> candidateIdSet = new HashSet<>(candidates.stream().map(User::getId).toList());

            Long lastOwnerUserId = dealRepository.findByDeletedFalseAndStatusIgnoreCaseOrderByConvertedAtDesc("Deal")
                    .stream()
                    .map(Deal::getOwnerUserId)
                    .filter(Objects::nonNull)
                    .filter(candidateIdSet::contains)
                    .findFirst()
                    .orElse(null);

            if (lastOwnerUserId == null) {
                return candidates.get(0);
            }

            int currentIndex = -1;
            for (int idx = 0; idx < candidates.size(); idx++) {
                if (Objects.equals(candidates.get(idx).getId(), lastOwnerUserId)) {
                    currentIndex = idx;
                    break;
                }
            }

            int nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % candidates.size();
            return candidates.get(nextIndex);
        } catch (Exception e) {
            logger.warn("Failed to resolve deal conversion owner: {}", e.getMessage());
            if (fallbackOwnerUserId == null) return null;
            return userRepository.findByIdAndIsDeletedFalse(fallbackOwnerUserId).orElse(null);
        }
    }

    public void deleteBySourceLeadId(Long sourceLeadId) {
        if (sourceLeadId == null) return;
        dealRepository.findBySourceLeadIdAndDeletedFalse(sourceLeadId).ifPresent(deal -> {
            deal.setDeleted(true);
            dealRepository.save(deal);
        });
    }

    @Transactional(readOnly = true)
    public List<DealResponse> list(String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleDealGroupIds(actor);
        return dealRepository.findByDeletedFalseOrderByConvertedAtDesc()
                .stream()
                .filter(deal -> canViewDeal(actor, deal, visibleGroupIds, null))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DealResponse getById(Long id, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleDealGroupIds(actor);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        if (!canViewDeal(actor, deal, visibleGroupIds, null)) {
            throw new AccessDeniedException("You do not have permission to access this deal");
        }
        return toResponse(deal);
    }

    public void delete(Long id, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        if (actor.getRole() != Role.SUPER_ADMIN && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only admins can delete deals");
        }
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        deal.setDeleted(true);
        dealRepository.save(deal);
    }

    public DealResponse updateDetails(Long id, java.util.Map<String, Object> updates, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        assertCanEditDeal(actor, deal);

        if (updates.containsKey("name") && updates.get("name") != null) {
            deal.setName(String.valueOf(updates.get("name")).trim());
        }
        if (updates.containsKey("email") && updates.get("email") != null) {
            deal.setEmail(normalizeNullable(String.valueOf(updates.get("email"))));
        }
        if (updates.containsKey("mobile") && updates.get("mobile") != null) {
            deal.setMobile(String.valueOf(updates.get("mobile")).trim());
        }
        if (updates.containsKey("countryCode") && updates.get("countryCode") != null) {
            deal.setCountryCode(normalizeNullable(String.valueOf(updates.get("countryCode"))));
        }
        if (updates.containsKey("primarySource") && updates.get("primarySource") != null) {
            deal.setPrimarySource(normalizeNullable(String.valueOf(updates.get("primarySource"))));
        }
        if (updates.containsKey("secondarySource") && updates.get("secondarySource") != null) {
            deal.setSecondarySource(normalizeNullable(String.valueOf(updates.get("secondarySource"))));
        }
        if (updates.containsKey("tertiarySource") && updates.get("tertiarySource") != null) {
            deal.setTertiarySource(normalizeNullable(String.valueOf(updates.get("tertiarySource"))));
        }
        if (updates.containsKey("projectName") && updates.get("projectName") != null) {
            deal.setProjectName(normalizeNullable(String.valueOf(updates.get("projectName"))));
        }
        if (updates.containsKey("companyName") && updates.get("companyName") != null) {
            deal.setCompanyName(normalizeNullable(String.valueOf(updates.get("companyName"))));
        }
        if (updates.containsKey("totalAmount") && updates.get("totalAmount") != null) {
            try {
                deal.setTotalAmount(new java.math.BigDecimal(String.valueOf(updates.get("totalAmount"))));
            } catch (Exception ignored) {}
        }
        if (updates.containsKey("requirementType") && updates.get("requirementType") != null) {
            deal.setRequirementType(normalizeNullable(String.valueOf(updates.get("requirementType"))));
        }
        if (updates.containsKey("requirementNotes") && updates.get("requirementNotes") != null) {
            deal.setRequirementNotes(String.valueOf(updates.get("requirementNotes")).trim());
        }
        if (updates.containsKey("requirementFileName") && updates.get("requirementFileName") != null) {
            deal.setRequirementFileName(String.valueOf(updates.get("requirementFileName")).trim());
        }
        if (updates.containsKey("designAssignedToUserId") && updates.get("designAssignedToUserId") != null) {
            try {
                deal.setDesignAssignedToUserId(Long.valueOf(String.valueOf(updates.get("designAssignedToUserId"))));
            } catch (Exception ignored) {}
        }
        if (updates.containsKey("productionAssignedToUserId") && updates.get("productionAssignedToUserId") != null) {
            try {
                deal.setProductionAssignedToUserId(Long.valueOf(String.valueOf(updates.get("productionAssignedToUserId"))));
            } catch (Exception ignored) {}
        }
        if (updates.containsKey("budgetInvoiceSent") && updates.get("budgetInvoiceSent") != null) {
            deal.setBudgetInvoiceSent(Boolean.parseBoolean(String.valueOf(updates.get("budgetInvoiceSent"))));
        }
        if (updates.containsKey("paymentInvoiceSent") && updates.get("paymentInvoiceSent") != null) {
            deal.setPaymentInvoiceSent(Boolean.parseBoolean(String.valueOf(updates.get("paymentInvoiceSent"))));
        }

        Deal saved = dealRepository.save(deal);
        syncInvoiceSentFlagsToLead(saved.getSourceLeadId(), saved.isBudgetInvoiceSent(), saved.isPaymentInvoiceSent());
        return toResponse(saved);
    }

    public DealResponse updateStatus(Long id, String newStatus, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        assertCanEditDeal(actor, deal);

        // Validate status transition against requirement type
        String reqType = deal.getRequirementType();
        if (reqType == null && deal.getSourceLeadId() != null) {
            // Fall back to source lead's requirement type (for deals created before the fix)
            Lead sourceLead = leadRepository.findByIdAndDeletedFalse(deal.getSourceLeadId()).orElse(null);
            if (sourceLead != null) {
                reqType = sourceLead.getRequirementType();
                // Also save it to the deal for future reference
                deal.setRequirementType(reqType);
            }
        }
        if (reqType != null && !reqType.isBlank()) {
            List<String> allowed = StatusRequirementTypeFilter.filter(List.of(newStatus), reqType);
            if (allowed.isEmpty()) {
                throw new IllegalArgumentException(
                    "Status '" + newStatus + "' is not allowed for requirement type '" + reqType + "'");
            }
        }

        deal.setStatus(newStatus);
        Deal saved = dealRepository.save(deal);
        createSourceLeadLog(saved, "Status changed to " + saved.getStatus(), actor);
        
        // Align deal payment assignment with lead payment verification flow.
        if ("payment".equalsIgnoreCase(newStatus) && deal.getSourceLeadId() != null) {
            leadRepository.findByIdAndDeletedFalse(deal.getSourceLeadId()).ifPresent(lead -> {
                assignPaymentVerificationRoundRobin(lead);
                leadRepository.save(lead);
            });
        }

        // Auto-assign design employee from the Deal Flow "Design" group
        if (("design".equalsIgnoreCase(newStatus) || "design + production".equalsIgnoreCase(newStatus))
                && deal.getSourceLeadId() != null) {
            assignDesignRequest(deal.getSourceLeadId());
        }

        // Auto-assign production employee from the Deal Flow "Production" group (round-robin)
        if ("production".equalsIgnoreCase(newStatus) && deal.getSourceLeadId() != null) {
            assignProductionRequest(deal.getSourceLeadId());
        }
        
        // Re-fetch so the response includes any fields set by assignDesignRequest / assignProductionRequest
        Deal latest = dealRepository.findByIdAndDeletedFalse(id).orElse(saved);
        return toResponse(latest);
    }

    public Map<String, Object> updatePaymentVerification(Long id,
                                                         LeadUpdateDetailsRequest request,
                                                         String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        assertCanEditDeal(actor, deal);
        if (deal.getSourceLeadId() == null) {
            throw new EntityNotFoundException("Source lead not found");
        }

        Lead lead = leadRepository.findByIdAndDeletedFalse(deal.getSourceLeadId())
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));

        if (request.getPaymentProofFileName() != null) {
            lead.setPaymentProofFileName(normalizeNullable(request.getPaymentProofFileName()));
        }
        if (request.getPaymentProofFilePath() != null) {
            lead.setPaymentProofFilePath(normalizeNullable(request.getPaymentProofFilePath()));
        }
        if (request.getPaymentProofNotes() != null) {
            lead.setPaymentProofNotes(normalizeNullable(request.getPaymentProofNotes()));
        }
        if (request.getPaymentVerificationStatus() != null) {
            lead.setPaymentVerificationStatus(normalizeNullable(request.getPaymentVerificationStatus()));
        }
        if (request.getPaymentVerificationRejectionReason() != null) {
            lead.setPaymentVerificationRejectionReason(normalizeNullable(request.getPaymentVerificationRejectionReason()));
        }
        if (request.getPaymentVerificationBillingAddressId() != null) {
            lead.setPaymentVerificationBillingAddressId(request.getPaymentVerificationBillingAddressId());
        }
        if (request.getPaymentVerificationShippingAddressId() != null) {
            lead.setPaymentVerificationShippingAddressId(request.getPaymentVerificationShippingAddressId());
        }
        if (request.getPaymentVerificationAssignedToUserId() != null) {
            lead.setPaymentVerificationAssignedToUserId(request.getPaymentVerificationAssignedToUserId());
        }
        if (request.getPaymentVerificationAmount() != null) {
            lead.setPaymentVerificationAmount(request.getPaymentVerificationAmount());
        }
        if (request.getPaymentMethod() != null) {
            lead.setPaymentMethod(normalizeNullable(request.getPaymentMethod()));
        }
        if (request.getTransactionId() != null) {
            lead.setTransactionId(normalizeNullable(request.getTransactionId()));
        }
        if (request.getPaymentDate() != null) {
            lead.setPaymentDate(request.getPaymentDate());
        }
        if (request.getPaymentNotes() != null) {
            lead.setPaymentNotes(normalizeNullable(request.getPaymentNotes()));
        }
        if (request.getRejectionNotes() != null) {
            lead.setRejectionNotes(normalizeNullable(request.getRejectionNotes()));
        }
        if (request.getPaymentVerifiedInvoiceData() != null) {
            lead.setPaymentVerifiedInvoiceData(request.getPaymentVerifiedInvoiceData());
            deal.setInvoiceData(request.getPaymentVerifiedInvoiceData());
        }
        if ("PENDING".equalsIgnoreCase(request.getPaymentVerificationStatus())) {
            assignPaymentVerificationRoundRobin(lead);
        }
        leadRepository.save(lead);
        dealRepository.save(deal);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", lead.getId());
        response.put("sourceLeadId", deal.getSourceLeadId());
        response.put("paymentProofFileName", lead.getPaymentProofFileName());
        response.put("paymentProofFilePath", lead.getPaymentProofFilePath());
        response.put("paymentProofNotes", lead.getPaymentProofNotes());
        response.put("paymentVerificationStatus", lead.getPaymentVerificationStatus());
        response.put("paymentVerificationRejectionReason", lead.getPaymentVerificationRejectionReason());
        response.put("paymentVerificationBillingAddressId", lead.getPaymentVerificationBillingAddressId());
        response.put("paymentVerificationShippingAddressId", lead.getPaymentVerificationShippingAddressId());
        response.put("paymentVerificationAssignedToUserId", lead.getPaymentVerificationAssignedToUserId());
        response.put("paymentVerificationAmount", lead.getPaymentVerificationAmount());
        response.put("paymentVerifiedInvoiceData", lead.getPaymentVerifiedInvoiceData());
        return response;
    }

    @Transactional(readOnly = true)
    public Long getSourceLeadIdForPaymentProofUpload(Long id, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        assertCanEditDeal(actor, deal);
        if (deal.getSourceLeadId() == null) {
            throw new EntityNotFoundException("Source lead not found");
        }
        return deal.getSourceLeadId();
    }

    /**
     * Called from LeadService when a lead's status changes to payment.
     * Updates the related deal's status and auto-assigns payment verification to the deal owner.
     */
    public void syncLeadStatusToDeal(Long sourceLeadId, String leadStatus, String actorPrincipal) {
        dealRepository.findBySourceLeadIdAndDeletedFalse(sourceLeadId).ifPresent(deal -> {
            deal.setStatus(leadStatus);
            final Deal savedDeal = dealRepository.save(deal);
            
            // Align deal payment assignment with lead payment verification flow.
            if ("payment".equalsIgnoreCase(leadStatus)) {
                leadRepository.findByIdAndDeletedFalse(sourceLeadId).ifPresent(lead -> {
                    assignPaymentVerificationRoundRobin(lead);
                    leadRepository.save(lead);
                });
            }
        });
    }

    private void assignPaymentVerificationRoundRobin(Lead lead) {
        try {
            if (lead == null) {
                return;
            }

            LeadFlowResponse flowResponse = leadFlowService.getFlow();
            List<Map<String, Object>> rules = flowResponse.getRules();
            if (rules == null || rules.isEmpty()) {
                return;
            }

            Long handledByGroupId = null;
            for (Map<String, Object> rule : rules) {
                if (rule == null) continue;
                Object statusVal = rule.get("status");
                if (statusVal != null && statusVal.toString().trim().equalsIgnoreCase("Accounts")) {
                    Object groupIdVal = rule.get("handledByGroupId");
                    if (groupIdVal != null) {
                        handledByGroupId = Long.parseLong(groupIdVal.toString());
                        break;
                    }
                }
            }

            if (handledByGroupId == null) {
                return;
            }

            List<UserGroupMember> eligibleMembers = userGroupMemberRepository
                    .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                            handledByGroupId,
                            Role.EMPLOYEE,
                            ActivationStatus.ACTIVE
                    );
            if (eligibleMembers.isEmpty()) {
                return;
            }

            List<User> candidates = eligibleMembers.stream()
                    .map(UserGroupMember::getUser)
                    .filter(Objects::nonNull)
                    .toList();
            List<Long> candidateIds = candidates.stream().map(User::getId).toList();
            Set<Long> candidateIdSet = new HashSet<>(candidateIds);

            Long lastAssignedUserId = leadRepository.findByDeletedFalseAndPaymentVerificationAssignedToUserIdIsNotNullOrderByUpdatedAtDesc()
                    .stream()
                    .map(Lead::getPaymentVerificationAssignedToUserId)
                    .filter(Objects::nonNull)
                    .filter(candidateIdSet::contains)
                    .findFirst()
                    .orElse(null);

            User nextAssignedUser;
            if (lastAssignedUserId == null) {
                nextAssignedUser = candidates.get(0);
            } else {
                int currentIndex = -1;
                for (int idx = 0; idx < candidates.size(); idx++) {
                    if (Objects.equals(candidates.get(idx).getId(), lastAssignedUserId)) {
                        currentIndex = idx;
                        break;
                    }
                }
                nextAssignedUser = currentIndex < 0
                        ? candidates.get(0)
                        : candidates.get((currentIndex + 1) % candidates.size());
            }

            lead.setPaymentVerificationAssignedToUserId(nextAssignedUser.getId());
        } catch (Exception e) {
            logger.warn("Failed to assign payment verification round-robin for deal: " + e.getMessage(), e);
        }
    }

    /**
     * Syncs invoice data from the source lead to its related deal.
     * Called whenever lead.invoiceData is updated so the deal stays current.
     */
    /**
     * When lead status changes to "Design", assigns a design request to the employee
     * configured in the Deal Flow for the "Design" status — round-robin, no ownership change.
     */
    public void assignDesignRequest(Long sourceLeadId) {
        dealRepository.findBySourceLeadIdAndDeletedFalse(sourceLeadId).ifPresent(deal -> {
            try {
                var flowResponse = dealFlowService.getFlow();
                List<Map<String, Object>> rules = flowResponse.getRules();
                if (rules == null || rules.isEmpty()) return;

                Long handledByGroupId = null;
                for (Map<String, Object> rule : rules) {
                    if (rule == null) continue;
                    Object statusVal = rule.get("status");
                    if (statusVal != null && statusVal.toString().trim().equalsIgnoreCase("Design")) {
                        Object groupIdVal = rule.get("handledByGroupId");
                        if (groupIdVal != null) {
                            handledByGroupId = Long.parseLong(groupIdVal.toString());
                            break;
                        }
                    }
                }
                if (handledByGroupId == null) return;

                List<UserGroupMember> eligibleMembers = userGroupMemberRepository
                        .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                                handledByGroupId, Role.EMPLOYEE, ActivationStatus.ACTIVE);
                if (eligibleMembers.isEmpty()) return;

                List<User> candidates = eligibleMembers.stream()
                        .map(UserGroupMember::getUser).filter(Objects::nonNull).toList();
                Set<Long> candidateIdSet = new HashSet<>(candidates.stream().map(User::getId).toList());

                User assignedUser = resolvePreferredFlowAssignee(
                        candidates,
                        candidateIdSet,
                        null,
                        deal.getDesignAssignedToUserId(),
                        dealRepository.findByDeletedFalseAndDesignAssignedToUserIdIsNotNullOrderByConvertedAtDesc()
                                .stream()
                                .map(Deal::getDesignAssignedToUserId)
                                .filter(Objects::nonNull)
                                .filter(candidateIdSet::contains)
                                .findFirst()
                                .orElse(null)
                );

                deal.setDesignAssignedToUserId(assignedUser.getId());
                deal.setDesignRequestStatus("PENDING");
                dealRepository.save(deal);
            } catch (Exception e) {
                logger.warn("Failed to assign design request round-robin: " + e.getMessage(), e);
            }
        });
    }

    /**
     * When a deal's status changes to "Production", assigns the production request
     * to an employee from the Deal Flow "Production" group — round-robin.
     * The assigned user ID is persisted on the source lead's productionOwnerId field
     * (which toResponse() reads to populate productionAssignedToUserId).
     */
    public void assignProductionRequest(Long sourceLeadId) {
        if (sourceLeadId == null) return;
        try {
            var flowResponse = dealFlowService.getFlow();
            List<Map<String, Object>> rules = flowResponse.getRules();
            if (rules == null || rules.isEmpty()) return;

            Long handledByGroupId = null;
            for (Map<String, Object> rule : rules) {
                if (rule == null) continue;
                Object statusVal = rule.get("status");
                if (statusVal != null && statusVal.toString().trim().equalsIgnoreCase("Production")) {
                    Object groupIdVal = rule.get("handledByGroupId");
                    if (groupIdVal != null) {
                        handledByGroupId = Long.parseLong(groupIdVal.toString());
                        break;
                    }
                }
            }
            if (handledByGroupId == null) return;

            List<UserGroupMember> eligibleMembers = userGroupMemberRepository
                    .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                            handledByGroupId, Role.EMPLOYEE, ActivationStatus.ACTIVE);
            if (eligibleMembers.isEmpty()) return;

            List<User> candidates = eligibleMembers.stream()
                    .map(UserGroupMember::getUser).filter(Objects::nonNull).toList();
            Set<Long> candidateIdSet = new HashSet<>(candidates.stream().map(User::getId).toList());

            Long rememberedProductionUserId = leadRepository.findByIdAndDeletedFalse(sourceLeadId)
                    .map(Lead::getProductionOwnerId)
                    .orElse(null);
            Long currentDealOwnerUserId = dealRepository.findBySourceLeadIdAndDeletedFalse(sourceLeadId)
                    .map(Deal::getOwnerUserId)
                    .orElse(null);

            User assignedUser = resolvePreferredFlowAssignee(
                    candidates,
                    candidateIdSet,
                    null,
                    rememberedProductionUserId,
                    dealRepository.findByDeletedFalseAndProductionAssignedToUserIdIsNotNullOrderByConvertedAtDesc()
                            .stream()
                            .map(Deal::getProductionAssignedToUserId)
                            .filter(Objects::nonNull)
                            .filter(candidateIdSet::contains)
                            .findFirst()
                            .orElse(null)
            );

            final Long assignedUserId = assignedUser.getId();
            leadRepository.findByIdAndDeletedFalse(sourceLeadId).ifPresent(lead -> {
                lead.setProductionOwnerId(assignedUserId);
                leadRepository.save(lead);
            });
            dealRepository.findBySourceLeadIdAndDeletedFalse(sourceLeadId).ifPresent(deal -> {
                deal.setProductionAssignedToUserId(assignedUserId);
                dealRepository.save(deal);
            });
        } catch (Exception e) {
            logger.warn("Failed to assign production request round-robin: " + e.getMessage(), e);
        }
    }

    private User resolvePreferredFlowAssignee(
            List<User> candidates,
            Set<Long> candidateIdSet,
            Long currentOwnerUserId,
            Long rememberedUserId,
            Long lastAssignedUserId
    ) {
        if (currentOwnerUserId != null && candidateIdSet.contains(currentOwnerUserId)) {
            return candidates.stream()
                    .filter(candidate -> Objects.equals(candidate.getId(), currentOwnerUserId))
                    .findFirst()
                    .orElse(candidates.get(0));
        }
        if (rememberedUserId != null && candidateIdSet.contains(rememberedUserId)) {
            return candidates.stream()
                    .filter(candidate -> Objects.equals(candidate.getId(), rememberedUserId))
                    .findFirst()
                    .orElse(candidates.get(0));
        }
        if (lastAssignedUserId == null) {
            return candidates.get(0);
        }

        int currentIndex = -1;
        for (int idx = 0; idx < candidates.size(); idx++) {
            if (Objects.equals(candidates.get(idx).getId(), lastAssignedUserId)) {
                currentIndex = idx;
                break;
            }
        }
        int nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % candidates.size();
        return candidates.get(nextIndex);
    }

    /**
     * Returns deals with status "Design".
     * Employees see only those assigned to them; admins/managers see all.
     */
    @Transactional(readOnly = true)
    public List<DealResponse> listDesignRequests(String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleDealGroupIds(actor);
        // Include both "Design" and "Design + Production" status deals in the design queue
        List<Deal> designDeals = dealRepository.findByDeletedFalseAndStatusIgnoreCaseOrderByConvertedAtDesc("Design");
        List<Deal> designPlusProductionDeals = dealRepository.findByDeletedFalseAndStatusIgnoreCaseOrderByConvertedAtDesc("Design + Production");
        List<Deal> all = new java.util.ArrayList<>();
        all.addAll(designDeals);
        all.addAll(designPlusProductionDeals);
        all.sort(java.util.Comparator.comparing(Deal::getConvertedAt, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));
        return all.stream()
                .filter(d -> canViewDesignRequest(actor, d, visibleGroupIds))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DealResponse> listProductionRequests(String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleDealGroupIds(actor);
        List<Deal> prodDeals = dealRepository.findByDeletedFalseAndStatusIgnoreCaseOrderByConvertedAtDesc("Production");
        List<Deal> designPlusProductionDeals = dealRepository.findByDeletedFalseAndStatusIgnoreCaseOrderByConvertedAtDesc("Design + Production");
        List<Deal> all = new java.util.ArrayList<>();
        all.addAll(prodDeals);
        all.addAll(designPlusProductionDeals);
        all.sort(java.util.Comparator.comparing(Deal::getConvertedAt, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));
        return all.stream()
                .filter(d -> canViewProductionRequest(actor, d, visibleGroupIds))
                .map(this::toResponse)
                .toList();
    }

    public void syncInvoiceDataToDeals(Long sourceLeadId, String invoiceData, java.math.BigDecimal cgstPercent, java.math.BigDecimal sgstPercent) {
        dealRepository.findBySourceLeadIdAndDeletedFalse(sourceLeadId).ifPresent(deal -> {
            if (invoiceData != null) deal.setInvoiceData(invoiceData);
            if (cgstPercent != null) deal.setInvoiceCgstPercent(cgstPercent);
            if (sgstPercent != null) deal.setInvoiceSgstPercent(sgstPercent);
            dealRepository.save(deal);
        });
    }

    public void syncInvoiceSentFlagsToDeal(Long sourceLeadId, Boolean budgetInvoiceSent, Boolean paymentInvoiceSent) {
        if (sourceLeadId == null) {
            return;
        }
        dealRepository.findBySourceLeadIdAndDeletedFalse(sourceLeadId).ifPresent(deal -> {
            if (budgetInvoiceSent != null) {
                deal.setBudgetInvoiceSent(budgetInvoiceSent);
            }
            if (paymentInvoiceSent != null) {
                deal.setPaymentInvoiceSent(paymentInvoiceSent);
            }
            dealRepository.save(deal);
        });
    }

    @Transactional(readOnly = true)
    public DealResponse getDealByLeadId(Long leadId) {
        Deal deal = dealRepository.findBySourceLeadIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found for lead ID: " + leadId));
        return toResponse(deal);
    }

    private void syncInvoiceSentFlagsToLead(Long sourceLeadId, boolean budgetInvoiceSent, boolean paymentInvoiceSent) {
        if (sourceLeadId == null) {
            return;
        }
        leadRepository.findByIdAndDeletedFalse(sourceLeadId).ifPresent(lead -> {
            lead.setBudgetInvoiceSent(budgetInvoiceSent);
            lead.setPaymentInvoiceSent(paymentInvoiceSent);
            leadRepository.save(lead);
        });
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private User assertAccess(String principal) {
        if (!StringUtils.hasText(principal)) {
            throw new AccessDeniedException("Unauthenticated");
        }
        User actor;
        if (principal.contains("@")) {
            actor = userRepository.findByEmailAndIsDeletedFalse(principal.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));
        } else {
            actor = userRepository.findByUsernameAndIsDeletedFalse(principal.trim())
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));
        }
        if (actor.getRole() != Role.SUPER_ADMIN
                && actor.getRole() != Role.ADMIN
                && actor.getRole() != Role.MANAGER
                && actor.getRole() != Role.EMPLOYEE) {
            throw new AccessDeniedException("You do not have permission to access deals");
        }
        if (actor.getRole() == Role.EMPLOYEE && findDealVisibleGroupsForActor(actor).isEmpty()) {
            throw new AccessDeniedException("No deal-accessible group is assigned to your account");
        }
        return actor;
    }

    public DealResponse updateProductionWorkStatus(Long id, String workStatus, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        assertCanEditDeal(actor, deal);
        deal.setProductionWorkStatus(workStatus);
        dealRepository.save(deal);
        return toResponse(deal);
    }

    private DealResponse toResponse(Deal deal) {
        DealResponse r = new DealResponse();
        r.setId(deal.getId());
        r.setSourceLeadId(deal.getSourceLeadId());
        r.setName(deal.getName());
        r.setEmail(deal.getEmail());
        r.setMobile(deal.getMobile());
        r.setCountryCode(deal.getCountryCode());
        r.setPrimarySource(deal.getPrimarySource());
        r.setSecondarySource(deal.getSecondarySource());
        r.setTertiarySource(deal.getTertiarySource());
        r.setProjectName(deal.getProjectName());
        r.setCompanyName(deal.getCompanyName());
        r.setOwner(deal.getOwner());
        r.setOwnerUserId(deal.getOwnerUserId());
        r.setConvertedByUserId(deal.getConvertedByUserId());
        r.setTotalAmount(deal.getTotalAmount());
        r.setPaidAmount(deal.getPaidAmount());
        r.setRemainingAmount(deal.getRemainingAmount());
        r.setInvoiceData(deal.getInvoiceData());
        r.setInvoiceCgstPercent(deal.getInvoiceCgstPercent());
        r.setInvoiceSgstPercent(deal.getInvoiceSgstPercent());
        r.setBudgetInvoiceSent(deal.isBudgetInvoiceSent());
        r.setPaymentInvoiceSent(deal.isPaymentInvoiceSent());
        r.setStatus(deal.getStatus());
        r.setConvertedAt(deal.getConvertedAt());
        r.setDesignAssignedToUserId(deal.getDesignAssignedToUserId());
        r.setDesignAssignedToName(resolveUserDisplayName(deal.getDesignAssignedToUserId()));
        r.setDesignRequestStatus(deal.getDesignRequestStatus());
        r.setDesignDraftFileName(deal.getDesignDraftFileName());
        r.setDesignDraftFilePath(deal.getDesignDraftFilePath());
        r.setDesignDraftCount(deal.getDesignDraftCount());
        r.setDesignSalesFeedback(deal.getDesignSalesFeedback());
        r.setDesignFinalFileName(deal.getDesignFinalFileName());
        r.setDesignFinalFilePath(deal.getDesignFinalFilePath());
        r.setProductionAssignedToUserId(deal.getProductionAssignedToUserId());
        String productionAssignedToName = resolveUserDisplayName(deal.getProductionAssignedToUserId());
        r.setProductionAssignedToUserName(productionAssignedToName);
        r.setProductionAssignedToName(productionAssignedToName);
        r.setProductionWorkStatus(deal.getProductionWorkStatus());
        String reqType = deal.getRequirementType();
        String reqNotes = deal.getRequirementNotes();
        if ((reqType == null || reqType.isBlank() || reqNotes == null || reqNotes.isBlank()) && deal.getSourceLeadId() != null) {
            Optional<Lead> leadOpt = leadRepository.findByIdAndDeletedFalse(deal.getSourceLeadId());
            if (leadOpt.isPresent()) {
                Lead lead = leadOpt.get();
                if (reqType == null || reqType.isBlank()) reqType = lead.getRequirementType();
                if (reqNotes == null || reqNotes.isBlank()) reqNotes = lead.getRequirementNotes();
            }
        }
        r.setRequirementType(reqType);
        r.setRequirementNotes(reqNotes);
        r.setRequirementFileName(deal.getRequirementFileName());
        r.setRequirementFilePath(deal.getRequirementFilePath());
        r.setArtworkFileName(deal.getArtworkFileName());
        r.setArtworkFilePath(deal.getArtworkFilePath());
        return r;
    }

    private String resolveUserDisplayName(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findByIdAndIsDeletedFalse(userId)
                .map(this::buildUserDisplayName)
                .orElse(null);
    }

    private String buildUserDisplayName(User user) {
        if (user == null) {
            return null;
        }
        String fullName = String.format("%s %s",
                        StringUtils.hasText(user.getFirstName()) ? user.getFirstName().trim() : "",
                        StringUtils.hasText(user.getLastName()) ? user.getLastName().trim() : "")
                .trim();
        if (StringUtils.hasText(fullName)) {
            return fullName;
        }
        if (StringUtils.hasText(user.getUsername())) {
            return user.getUsername().trim();
        }
        return null;
    }

    // --- Design Workflow Methods ---
    public DealResponse startDesignWork(Long id, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        assertCanEditDeal(actor, deal);
        deal.setDesignRequestStatus("WORK_STARTED");
        dealRepository.save(deal);
        createSourceLeadLog(deal, "Design work started", actor);
        return toResponse(deal);
    }

    public DealResponse uploadDesignDraft(Long id, org.springframework.web.multipart.MultipartFile file, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        assertCanEditDeal(actor, deal);
        String originalName = null;
        Integer nextDraftVersion = (deal.getDesignDraftCount() == null ? 0 : deal.getDesignDraftCount()) + 1;
        if (file != null && !file.isEmpty()) {
            try {
                originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "draft");
                String filename = UUID.randomUUID() + "_" + originalName;
                Path dir = Paths.get(uploadDir, "design-drafts").toAbsolutePath().normalize();
                Files.createDirectories(dir);
                Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
                deal.setDesignDraftFileName(originalName);
                deal.setDesignDraftFilePath("uploads/design-drafts/" + filename);
                deal.setDesignDraftCount(nextDraftVersion);
            } catch (IOException e) {
                logger.warn("Failed to save design draft file: {}", e.getMessage());
            }
        }
        deal.setDesignRequestStatus("DRAFT_READY");
        dealRepository.save(deal);
        if (StringUtils.hasText(originalName)) {
            createSourceLeadLog(
                    deal,
                    "Draft V" + nextDraftVersion + " uploaded",
                    actor,
                    originalName,
                    deal.getDesignDraftFilePath()
            );
        }
        return toResponse(deal);
    }

    public DealResponse sendDesignFeedback(Long id, String message, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        assertCanEditDeal(actor, deal);
        if (message != null && !message.isBlank()) {
            String existing = deal.getDesignSalesFeedback();
            String updated = (existing != null && !existing.isBlank())
                    ? existing + "\n---\n" + message.trim()
                    : message.trim();
            deal.setDesignSalesFeedback(updated);
        }
        deal.setDesignRequestStatus("FEEDBACK_SENT");
        dealRepository.save(deal);
        createSourceLeadLog(deal, "Design feedback sent", actor);
        return toResponse(deal);
    }

    public DealResponse approveFinalDesign(Long id, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        assertCanEditDeal(actor, deal);
        deal.setDesignRequestStatus("FINAL_APPROVED");
        dealRepository.save(deal);
        createSourceLeadLog(deal, "Design approved for final upload", actor);
        return toResponse(deal);
    }

    public DealResponse uploadFinalDesign(Long id, org.springframework.web.multipart.MultipartFile file, String actorPrincipal) {
        User actor = assertAccess(actorPrincipal);
        Deal deal = dealRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Deal not found"));
        assertCanEditDeal(actor, deal);
        String originalName = null;
        if (file != null && !file.isEmpty()) {
            try {
                originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "final");
                String filename = UUID.randomUUID() + "_" + originalName;
                Path dir = Paths.get(uploadDir, "design-finals").toAbsolutePath().normalize();
                Files.createDirectories(dir);
                Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
                deal.setDesignFinalFileName(originalName);
                deal.setDesignFinalFilePath("uploads/design-finals/" + filename);
            } catch (IOException e) {
                logger.warn("Failed to save final design file: {}", e.getMessage());
            }
        }
        deal.setDesignRequestStatus("FINAL_UPLOADED");
        dealRepository.save(deal);
        if (StringUtils.hasText(originalName)) {
            createSourceLeadLog(
                    deal,
                    "Final design uploaded",
                    actor,
                    originalName,
                    deal.getDesignFinalFilePath()
            );
        } else {
            createSourceLeadLog(deal, "Final design uploaded", actor, null, null);
        }

        // Auto-transition: if requirement type is "Design + Production" and deal is
        // currently in "Design" or "Design + Production" status, automatically move to "Production" after final upload.
        String requirementTypeToCheck = deal.getRequirementType();
        if (requirementTypeToCheck == null && deal.getSourceLeadId() != null) {
            // Fall back to source lead's requirement type (for deals created before the fix)
            Lead sourceLead = leadRepository.findByIdAndDeletedFalse(deal.getSourceLeadId()).orElse(null);
            if (sourceLead != null) {
                requirementTypeToCheck = sourceLead.getRequirementType();
                // Also save it to the deal for future reference
                deal.setRequirementType(requirementTypeToCheck);
            }
        }
        
        if ("Design + Production".equalsIgnoreCase(requirementTypeToCheck)
                && ("design".equalsIgnoreCase(deal.getStatus()) || "design + production".equalsIgnoreCase(deal.getStatus()))) {
            deal.setStatus("Production");
            dealRepository.save(deal);
            // Assign production employee via round-robin
            if (deal.getSourceLeadId() != null) {
                assignProductionRequest(deal.getSourceLeadId());
            }
            logger.info("Auto-transitioned deal {} from Design to Production (Design + Production requirement)", id);
        }

        return toResponse(deal);
    }

    private void createSourceLeadLog(Deal deal, String action, User actor, String fileName, String filePath) {
        if (deal == null || deal.getSourceLeadId() == null || !StringUtils.hasText(action) || actor == null) {
            return;
        }
        com.nexorcrm.backend.entity.LeadLog log = new com.nexorcrm.backend.entity.LeadLog();
        log.setLeadId(deal.getSourceLeadId());
        log.setAction(action.trim());
        String actorName = StringUtils.hasText(actor.getUsername())
                ? actor.getUsername()
                : actor.getEmail();
        log.setActor(actorName);
        log.setFileName(StringUtils.hasText(fileName) ? fileName.trim() : null);
        log.setFilePath(StringUtils.hasText(filePath) ? filePath.trim() : null);
        leadLogRepository.save(log);
    }

    private void createSourceLeadLog(Deal deal, String action, User actor) {
        createSourceLeadLog(deal, action, actor, null, null);
    }

    private List<UserGroup> findDealVisibleGroupsForActor(User actor) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return userGroupRepository.findAllByOrderByNameAsc().stream()
                    .filter(this::hasDealVisibility)
                    .toList();
        }

        if (actor.getRole() == Role.ADMIN) {
            assertDepartmentScope(actor);
            return userGroupRepository
                    .findByInstitutionNameIgnoreCaseAndDepartmentNameIgnoreCaseOrderByNameAsc(
                            actor.getInstitutionName(),
                            actor.getDepartmentName()
                    ).stream()
                    .filter(this::hasDealVisibility)
                    .toList();
        }

        if (actor.getRole() == Role.MANAGER) {
            assertTeamScope(actor);
            return userGroupRepository
                    .findByInstitutionNameIgnoreCaseAndDepartmentNameIgnoreCaseOrderByNameAsc(
                            actor.getInstitutionName(),
                            actor.getDepartmentName()
                    ).stream()
                    .filter(this::hasDealVisibility)
                    .filter(group -> groupIncludesTeam(group, actor.getTeamName()))
                    .toList();
        }

        if (actor.getRole() == Role.EMPLOYEE) {
            Map<Long, UserGroup> byId = new LinkedHashMap<>();
            for (UserGroupMember membership : userGroupMemberRepository.findByUser_IdOrderByIdAsc(actor.getId())) {
                UserGroup group = membership.getGroup();
                if (group != null
                        && group.getId() != null
                        && hasDealVisibility(group)
                        && memberHasDealVisibility(membership)) {
                    byId.putIfAbsent(group.getId(), group);
                }
            }
            return List.copyOf(byId.values());
        }

        return List.of();
    }

    private Set<Long> resolveVisibleDealGroupIds(User actor) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return Set.of();
        }
        return findDealVisibleGroupsForActor(actor).stream()
                .map(UserGroup::getId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
    }

    private boolean canViewDeal(User actor, Deal deal, Set<Long> visibleGroupIds, Lead sourceLeadOverride) {
        if (actor.getRole() == Role.SUPER_ADMIN || actor.getRole() == Role.ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.EMPLOYEE) {
            return canEditDeal(actor, deal);
        }
        // MANAGER: check source lead group, design/production assignments, or ownership
        Lead sourceLead = sourceLeadOverride != null ? sourceLeadOverride : loadSourceLead(deal);
        if (sourceLead != null && sourceLead.getAssignedGroupId() != null
                && visibleGroupIds.contains(sourceLead.getAssignedGroupId())) {
            return true;
        }
        if (canViewDesignRequest(actor, deal, visibleGroupIds)) {
            return true;
        }
        if (canViewProductionRequest(actor, deal, visibleGroupIds)) {
            return true;
        }
        if (deal.getOwnerUserId() != null) {
            return Objects.equals(deal.getOwnerUserId(), actor.getId());
        }
        return false;
    }

    private boolean canViewDesignRequest(User actor, Deal deal, Set<Long> visibleGroupIds) {
        if (actor.getRole() == Role.SUPER_ADMIN || actor.getRole() == Role.ADMIN) {
            return true;
        }
        
        // For MANAGER: can see if assigned employee is in their visible groups
        if (actor.getRole() == Role.MANAGER) {
            if (deal.getDesignAssignedToUserId() != null && !visibleGroupIds.isEmpty()) {
                // Check if the assigned employee is a member of any of the manager's visible groups
                long assignedUserId = deal.getDesignAssignedToUserId();
                List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(assignedUserId);
                return memberships.stream()
                        .anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()));
            }
            return false;
        }
        
        // For EMPLOYEE: can only see if assigned to them
        if (actor.getRole() != Role.EMPLOYEE) {
            return false;
        }
        return Objects.equals(deal.getDesignAssignedToUserId(), actor.getId());
    }

    private boolean canViewProductionRequest(User actor, Deal deal, Set<Long> visibleGroupIds) {
        if (actor.getRole() == Role.SUPER_ADMIN || actor.getRole() == Role.ADMIN) {
            return true;
        }
        
        // For MANAGER: can see if assigned employee is in their visible groups
        if (actor.getRole() == Role.MANAGER) {
            if (deal.getProductionAssignedToUserId() != null && !visibleGroupIds.isEmpty()) {
                // Check if the assigned employee is a member of any of the manager's visible groups
                long assignedUserId = deal.getProductionAssignedToUserId();
                List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(assignedUserId);
                return memberships.stream()
                        .anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()));
            }
            return false;
        }
        
        // For EMPLOYEE: can only see if assigned to them
        if (actor.getRole() != Role.EMPLOYEE) {
            return false;
        }
        return Objects.equals(deal.getProductionAssignedToUserId(), actor.getId());
    }

    private boolean canEditDeal(User actor, Deal deal) {
        if (actor.getRole() == Role.SUPER_ADMIN
                || actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.MANAGER) {
            return true;
        }
        if (actor.getRole() != Role.EMPLOYEE) {
            return false;
        }
        return Objects.equals(deal.getOwnerUserId(), actor.getId())
                || Objects.equals(deal.getDesignAssignedToUserId(), actor.getId())
                || Objects.equals(deal.getProductionAssignedToUserId(), actor.getId());
    }

    private void assertCanEditDeal(User actor, Deal deal) {
        Set<Long> visibleGroupIds = resolveVisibleDealGroupIds(actor);
        if (!canViewDeal(actor, deal, visibleGroupIds, null) || !canEditDeal(actor, deal)) {
            throw new AccessDeniedException("You do not have permission to update this deal");
        }
    }

    private Lead loadSourceLead(Deal deal) {
        if (deal == null || deal.getSourceLeadId() == null) {
            return null;
        }
        return leadRepository.findByIdAndDeletedFalse(deal.getSourceLeadId()).orElse(null);
    }

    private boolean hasDealVisibility(UserGroup group) {
        return hasAnyPageAccess(group == null ? null : group.getPageKeysCsv());
    }

    private boolean memberHasDealVisibility(UserGroupMember membership) {
        return hasAnyPageAccess(membership == null ? null : membership.getPageKeysCsv());
    }

    private boolean hasAnyPageAccess(String pageKeysCsv) {
        if (!StringUtils.hasText(pageKeysCsv)) {
            return true;
        }
        return parseCsv(pageKeysCsv).stream()
                .anyMatch(value -> DEAL_RECORD_PAGE_KEYS.stream().anyMatch(key -> key.equalsIgnoreCase(value)));
    }

    private boolean groupIncludesTeam(UserGroup group, String teamName) {
        if (!StringUtils.hasText(teamName)) {
            return false;
        }
        return parseCsv(group == null ? null : group.getTeamNamesCsv()).stream()
                .anyMatch(value -> value.equalsIgnoreCase(teamName.trim()));
    }

    private List<String> parseCsv(String csv) {
        if (!StringUtils.hasText(csv)) {
            return List.of();
        }
        return java.util.Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private void assertDepartmentScope(User actor) {
        if (!StringUtils.hasText(actor.getInstitutionName())
                || !StringUtils.hasText(actor.getDepartmentName())) {
            throw new AccessDeniedException("Your account is missing department scope configuration");
        }
    }

    private void assertTeamScope(User actor) {
        assertDepartmentScope(actor);
        if (!StringUtils.hasText(actor.getTeamName())) {
            throw new AccessDeniedException("Your account is missing team scope configuration");
        }
    }
}
