
package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.BulkLeadCreateRequest;
import com.nexorcrm.backend.dto.BulkLeadItem;
import com.nexorcrm.backend.dto.BulkLeadResponse;
import com.nexorcrm.backend.dto.CheckDuplicatesContactResponse;
import com.nexorcrm.backend.dto.CheckDuplicatesRequest;
import com.nexorcrm.backend.dto.ConvertDuplicateRequest;
import com.nexorcrm.backend.dto.ConvertDuplicateResponse;
import com.nexorcrm.backend.dto.LeadAllocatorOptionResponse;
import com.nexorcrm.backend.dto.LeadAssignableGroupResponse;
import com.nexorcrm.backend.dto.LeadCreateRequest;
import com.nexorcrm.backend.dto.LeadFiltersResponse;
import com.nexorcrm.backend.dto.LeadLogResponse;
import com.nexorcrm.backend.dto.LeadResponse;
import com.nexorcrm.backend.dto.LeadUpdateAllocatorRequest;
import com.nexorcrm.backend.dto.LeadUpdateStatusRequest;
import com.nexorcrm.backend.dto.LeadUpdateDetailsRequest;
import com.nexorcrm.backend.dto.PaymentRequest;
import com.nexorcrm.backend.dto.DesignRequirementRequest;
import com.nexorcrm.backend.dto.ProductionRequirementRequest;
import com.nexorcrm.backend.entity.ActivationStatus;
import com.nexorcrm.backend.entity.Deal;
import com.nexorcrm.backend.entity.Lead;
import com.nexorcrm.backend.entity.LeadLog;
import com.nexorcrm.backend.entity.LeadInvoiceItem;
import com.nexorcrm.backend.entity.BranchMaster;
import com.nexorcrm.backend.entity.DepartmentMaster;
import com.nexorcrm.backend.entity.DesignationMaster;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.LeadStatus;
import com.nexorcrm.backend.entity.PrimarySource;
import com.nexorcrm.backend.entity.SecondarySource;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.entity.UserGroup;
import com.nexorcrm.backend.entity.UserGroupMember;
import com.nexorcrm.backend.entity.EmailTemplate;
import com.nexorcrm.backend.entity.EmailTemplateKey;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.DealRepository;
import com.nexorcrm.backend.repo.DepartmentMasterRepository;
import com.nexorcrm.backend.repo.DesignationMasterRepository;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.LeadRepository;
import com.nexorcrm.backend.repo.LeadLogRepository;
import com.nexorcrm.backend.repo.LeadInvoiceItemRepository;
import com.nexorcrm.backend.repo.LeadStatusRepository;
import com.nexorcrm.backend.repo.LeadTypeRepository;
import com.nexorcrm.backend.repo.PrimarySourceRepository;
import com.nexorcrm.backend.repo.RequirementRepository;
import com.nexorcrm.backend.repo.SecondarySourceRepository;
import com.nexorcrm.backend.repo.UserGroupMemberRepository;
import com.nexorcrm.backend.repo.UserGroupRepository;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.repo.EmailTemplateRepository;
import com.nexorcrm.backend.security.RolePermissionUtil;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeadService {

    private static final String LEADS_PAGE_KEY = "leads";
    private static final Set<String> LEAD_RECORD_PAGE_KEYS = Set.of(
            "leads",
            "deals",
            "design",
            "production",
            "budget-verifications",
            "budget-verifications-page",
            "payment-verifications",
            "payment-verifications-page",
            "accounts",
            "stock-requests",
            "stocks"
    );
    private static final Comparator<UserGroup> GROUP_ORDER_COMPARATOR =
            Comparator.comparing((UserGroup g) -> StringUtils.hasText(g.getName()) ? g.getName().toLowerCase(Locale.ROOT) : "")
                    .thenComparing(g -> g.getId() == null ? Long.MAX_VALUE : g.getId());

    private final LeadRepository leadRepository;
    private final LeadLogRepository leadLogRepository;
    private final DealRepository dealRepository;
    private final LeadStatusRepository leadStatusRepository;
    private final LeadTypeRepository leadTypeRepository;
    private final UserRepository userRepository;
    private final UserGroupRepository userGroupRepository;
    private final UserGroupMemberRepository userGroupMemberRepository;
    private final EmployeeRepository employeeRepository;
    private final DesignationMasterRepository designationMasterRepository;
    private final DepartmentMasterRepository departmentMasterRepository;
    private final BranchMasterRepository branchMasterRepository;
    private final AuditService auditService;
    private final LeadFlowService leadFlowService;
    private final DealFlowService dealFlowService;
    private final LeadChatService leadChatService;
    private final ObjectMapper objectMapper;
    private final LeadInvoiceItemRepository leadInvoiceItemRepository;
    private final DealService dealService;
    private final DesignRequirementService designRequirementService;
    private final ProductionRequirementService productionRequirementService;
    private final PrimarySourceRepository primarySourceRepository;
    private final RequirementRepository requirementRepository;
    private final SecondarySourceRepository secondarySourceRepository;
    private final EmailNotificationService emailNotificationService;
    private final EmailTemplateRepository emailTemplateRepository;
    private static final String DEFAULT_CUSTOMER_PASSWORD = "Customer@123";
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private static final Logger logger = LoggerFactory.getLogger(LeadService.class);

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public LeadService(LeadRepository leadRepository,
                       LeadLogRepository leadLogRepository,
                       DealRepository dealRepository,
                       LeadStatusRepository leadStatusRepository,
                       LeadTypeRepository leadTypeRepository,
                       UserRepository userRepository,
                       UserGroupRepository userGroupRepository,
                       UserGroupMemberRepository userGroupMemberRepository,
                       EmployeeRepository employeeRepository,
                       DesignationMasterRepository designationMasterRepository,
                       DepartmentMasterRepository departmentMasterRepository,
                       BranchMasterRepository branchMasterRepository,
                       AuditService auditService,
                       LeadFlowService leadFlowService,
                       DealFlowService dealFlowService,
                       LeadChatService leadChatService,
                       ObjectMapper objectMapper,
                       LeadInvoiceItemRepository leadInvoiceItemRepository,
                       DealService dealService,
                       DesignRequirementService designRequirementService,
                       ProductionRequirementService productionRequirementService,
                       PrimarySourceRepository primarySourceRepository,
                       RequirementRepository requirementRepository,
                       SecondarySourceRepository secondarySourceRepository,
                       EmailNotificationService emailNotificationService,
                       EmailTemplateRepository emailTemplateRepository) {
        this.leadRepository = leadRepository;
        this.leadLogRepository = leadLogRepository;
        this.dealRepository = dealRepository;
        this.leadStatusRepository = leadStatusRepository;
        this.leadTypeRepository = leadTypeRepository;
        this.userRepository = userRepository;
        this.userGroupRepository = userGroupRepository;
        this.userGroupMemberRepository = userGroupMemberRepository;
        this.employeeRepository = employeeRepository;
        this.designationMasterRepository = designationMasterRepository;
        this.departmentMasterRepository = departmentMasterRepository;
        this.branchMasterRepository = branchMasterRepository;
        this.auditService = auditService;
        this.leadFlowService = leadFlowService;
        this.dealFlowService = dealFlowService;
        this.leadChatService = leadChatService;
        this.objectMapper = objectMapper;
        this.leadInvoiceItemRepository = leadInvoiceItemRepository;
        this.dealService = dealService;
        this.designRequirementService = designRequirementService;
        this.productionRequirementService = productionRequirementService;
        this.primarySourceRepository = primarySourceRepository;
        this.requirementRepository = requirementRepository;
        this.secondarySourceRepository = secondarySourceRepository;
        this.emailNotificationService = emailNotificationService;
        this.emailTemplateRepository = emailTemplateRepository;
    }

    /**
     * Handle a payment request coming from a customer.
     * Updates the paid and remaining amounts on the associated lead.
     */
    public LeadResponse recordCustomerPayment(String customerEmail, com.nexorcrm.backend.dto.PaymentRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Payment request required");
        }
        String type = request.getType() == null ? "" : request.getType().trim().toLowerCase();
        BigDecimal amt = request.getAmount();
        // if amount is missing/zero and caller asked for a full payment, default to
        // whatever remains on the lead
        if ((amt == null || amt.compareTo(BigDecimal.ZERO) <= 0) && "full".equals(type)) {
            // will resolve later once we have the lead row
        } else if (amt == null || amt.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }
        String emailNormalized = normalizeEmail(customerEmail);
        Lead row = leadRepository.findTopByDeletedFalseAndEmailNormalizedOrderByCreatedAtDesc(emailNormalized)
                .orElseThrow(() -> new EntityNotFoundException("Customer lead not found"));

        if (row.getStatus() == null || !row.getStatus().equalsIgnoreCase("payment")) {
            throw new IllegalStateException("Lead is not in payment status");
        }

        if ((amt == null || amt.compareTo(BigDecimal.ZERO) <= 0) && "full".equals(type)) {
            // pay remaining amount (fallback to total if remaining is null)
            amt = row.getRemainingAmount();
            if (amt == null || amt.compareTo(BigDecimal.ZERO) <= 0) {
                amt = row.getTotalAmount();
            }
        }
        if (amt == null || amt.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }

        BigDecimal paid = row.getPaidAmount() == null ? BigDecimal.ZERO : row.getPaidAmount();
        paid = paid.add(amt);
        row.setPaidAmount(paid);
        if (row.getTotalAmount() != null) {
            BigDecimal rem = row.getTotalAmount().subtract(paid);
            row.setRemainingAmount(rem.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : rem);
        }

        Lead saved = leadRepository.save(row);
        Map<Long, String> groupNameMap = loadGroupNameMap(List.of(saved));
        Map<Long, String> userNameMap = loadUserNameMap(List.of(saved));
        return toResponse(saved, groupNameMap, userNameMap);
    }

    @Transactional(readOnly = true)
    public LeadResponse getCustomerLeadByUserId(Long userId) {
        if (userId == null) {
            throw new EntityNotFoundException("Customer user not found");
        }

        User customer = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new EntityNotFoundException("Customer user not found"));
        String emailNormalized = normalizeEmail(customer.getEmail());
        if (!StringUtils.hasText(emailNormalized)) {
            throw new EntityNotFoundException("Customer lead not found");
        }

        Lead lead = leadRepository.findTopByDeletedFalseAndEmailNormalizedOrderByCreatedAtDesc(emailNormalized)
                .orElseThrow(() -> new EntityNotFoundException("Customer lead not found"));
        Map<Long, String> groupNameMap = loadGroupNameMap(List.of(lead));
        Map<Long, String> userNameMap = loadUserNameMap(List.of(lead));
        return toResponse(lead, groupNameMap, userNameMap);
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> list(String actorPrincipal,
                                   String search,
                                   String project,
                                   String primary,
                                   String status,
                                   String svStatus,
                                   String owner,
                                   String quickDate) {
        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        boolean paymentFilter = StringUtils.hasText(status) && status.equalsIgnoreCase("payment");
        List<Lead> rows = leadRepository.findByDeletedFalseOrderByCreatedAtDesc().stream()
                .filter(row -> !row.isDuplicate())
                .filter(row -> canViewLead(actor, row, visibleGroupIds))
                .filter(row -> containsIgnoreCase(row.getName(), search)
                        || containsIgnoreCase(row.getMobile(), search)
                        || containsIgnoreCase(row.getEmail(), search))
                .filter(row -> equalsIgnoreCase(row.getProjectName(), project))
                .filter(row -> equalsIgnoreCase(row.getPrimarySource(), primary))
                .filter(row -> {
                    if (paymentFilter) {
                        // show all leads in payment status plus any lead that has
                        // been moved into design while preserving the payment owner
                        if ("payment".equalsIgnoreCase(row.getStatus())) {
                            return true;
                        }
                        if ("design".equalsIgnoreCase(row.getStatus())
                                && row.getPaymentOwnerId() != null
                                && Objects.equals(row.getPaymentOwnerId(), actor.getId())) {
                            return true;
                        }
                        return false;
                    }
                    return matchesLeadStatus(getEffectiveLeadStatus(row), status);
                })
                .filter(row -> equalsIgnoreCase(row.getSvStatus(), svStatus))
                .filter(row -> equalsIgnoreCase(row.getOwner(), owner))
                .filter(row -> matchQuickDate(row.getCreatedAt(), quickDate))
                .toList();

        Map<Long, String> groupNameMap = loadGroupNameMap(rows);
        Map<Long, String> userNameMap = loadUserNameMap(rows);

        return rows.stream()
                .map(row -> toResponse(row, groupNameMap, userNameMap))
                .toList();
    }

    @Transactional(readOnly = true)
    public LeadResponse getById(Long id, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        Lead row = leadRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        if (!canViewLead(actor, row, visibleGroupIds)) {
            throw new AccessDeniedException("You do not have permission to access this lead");
        }

        Map<Long, String> groupNameMap = new HashMap<>();
        if (row.getAssignedGroupId() != null) {
            userGroupRepository.findById(row.getAssignedGroupId()).ifPresent(group -> groupNameMap.put(group.getId(), group.getName()));
        }

        Map<Long, String> userNameMap = new HashMap<>();
        if (row.getAllocatorUserId() != null) {
            userRepository.findById(row.getAllocatorUserId()).ifPresent(user -> userNameMap.put(user.getId(), user.getUsername()));
        }
        if (row.getOwnerUserId() != null) {
            userRepository.findById(row.getOwnerUserId()).ifPresent(user -> userNameMap.put(user.getId(), user.getUsername()));
        }

        return toResponse(row, groupNameMap, userNameMap);
    }

    @Transactional(readOnly = true)
    public List<LeadAllocatorOptionResponse> getImportableEmployees(String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Long flowGroupId = resolveFlowGroupForStatus(actor, "New Lead");
        List<UserGroup> groups = flowGroupId != null
                ? java.util.List.of(resolveLeadGroupForCreate(actor, flowGroupId))
                : findLeadVisibleGroupsForActor(actor);

        Map<Long, LeadAllocatorOptionResponse> seen = new LinkedHashMap<>();
        for (UserGroup group : groups) {
            List<UserGroupMember> members = userGroupMemberRepository
                    .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                            group.getId(),
                            Role.EMPLOYEE,
                            ActivationStatus.ACTIVE
                    );
            for (UserGroupMember m : members) {
                if (!memberHasLeadVisibility(m)) continue;
                User u = m.getUser();
                if (u == null || u.getId() == null) continue;
                if (actor.getRole() == Role.MANAGER && !isSameDepartmentScope(u, actor)) continue;
                if (actor.getRole() == Role.TEAM_LEAD && !isSameTeamScope(u, actor)) continue;
                seen.putIfAbsent(u.getId(), toAllocatorOptionResponse(u));
            }
        }
        return new java.util.ArrayList<>(seen.values());
    }

    @Transactional
    public BulkLeadResponse bulkCreate(BulkLeadCreateRequest request, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        if (actor.getRole() == Role.EMPLOYEE) {
            throw new AccessDeniedException("Employees cannot use bulk import");
        }

        Long flowGroupId = StringUtils.hasText(request.getInstitutionName())
                ? resolveFlowGroupForStatusInScope(request.getInstitutionName(), "New Lead")
                : resolveFlowGroupForStatus(actor, "New Lead");

        java.util.ArrayList<String> errors = new java.util.ArrayList<>();
        java.util.ArrayList<Lead> toSave = new java.util.ArrayList<>();

        for (int i = 0; i < request.getLeads().size(); i++) {
            BulkLeadItem item = request.getLeads().get(i);
            int rowNum = i + 1;

            User assignedUser;
            try {
                assignedUser = userRepository.findById(item.getAssignedUserId())
                        .orElseThrow(() -> new EntityNotFoundException("User not found"));
                if (assignedUser.getRole() != Role.EMPLOYEE
                        || !assignedUser.isActive()
                        || assignedUser.getActivationStatus() != ActivationStatus.ACTIVE
                        || assignedUser.isDeleted()) {
                    errors.add("Row " + rowNum + ": assigned user is not an active employee");
                    continue;
                }
            } catch (EntityNotFoundException e) {
                errors.add("Row " + rowNum + ": assigned user ID " + item.getAssignedUserId() + " not found");
                continue;
            }

            String mobile = item.getMobile().trim();
            String mobileNormalized = normalizeMobile(mobile);
            if (!StringUtils.hasText(mobileNormalized)) {
                errors.add("Row " + rowNum + ": mobile number is invalid");
                continue;
            }

            Long groupId = flowGroupId;
            if (groupId == null) {
                List<UserGroup> groups = findLeadVisibleGroupsForActor(actor);
                if (groups.isEmpty()) {
                    errors.add("Row " + rowNum + ": no lead group available for assignment");
                    continue;
                }
                groupId = groups.get(0).getId();
            }

            boolean isEligibleForSelectedGroup = userGroupMemberRepository
                    .findByGroup_IdAndUser_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalse(
                            groupId,
                            assignedUser.getId(),
                            Role.EMPLOYEE,
                            ActivationStatus.ACTIVE
                    ).stream()
                    .anyMatch(this::memberHasLeadVisibility);
            if (!isEligibleForSelectedGroup) {
                errors.add("Row " + rowNum + ": assigned user is not eligible for the selected lead group");
                continue;
            }

            Lead row = new Lead();
            row.setLeadId("LEAD_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase(Locale.ROOT));
            row.setEuid(leadRepository.countByDeletedFalse() + toSave.size() + 1);
            row.setName(item.getName().trim());
            row.setMobile(mobile);
            row.setMobileNormalized(mobileNormalized);
            row.setPrimarySource(item.getPrimarySource().trim());
            validateSecondarySourceForPrimary(row.getPrimarySource(), item.getSecondarySource());
            row.setLeadPincode(normalizeNullable(item.getLeadPincode()));
            row.setEmail(normalizeNullable(item.getEmail()));
            row.setCountryCode(normalizeNullable(item.getCountryCode()));
            row.setSecondarySource(normalizeNullable(item.getSecondarySource()));
            row.setCompanyName(normalizeNullable(item.getCompanyName()));
            row.setProductType(normalizeNullable(item.getProductType()));
            row.setVariant(normalizeNullable(item.getVariant()));
            row.setQuantity(item.getQuantity());
            row.setLeadCountry(normalizeNullable(item.getLeadCountry()));
            row.setLeadState(normalizeNullable(item.getLeadState()));
            row.setLeadCity(normalizeNullable(item.getLeadCity()));
            row.setStreetAddress(normalizeNullable(item.getStreetAddress()));
            row.setStatus("New Lead");
            row.setSvStatus(null);
            row.setAssignedGroupId(groupId);
            row.setAllocatorUserId(actor.getId());
            row.setOwnerUserId(assignedUser.getId());
            row.setOwner(assignedUser.getUsername());
            if (item.isDuplicate()) {
                row.setDuplicate(true);
                row.setDuplicateOfLeadId(item.getDuplicateOfLeadId());
                row.setDuplicateOfLeadRef(item.getDuplicateOfLeadRef());
                row.setDuplicateOfLeadName(item.getDuplicateOfLeadName());
            }
            toSave.add(row);
        }

        if (!errors.isEmpty()) {
            throw new IllegalStateException("Bulk import failed: " + String.join("; ", errors));
        }

        leadRepository.saveAll(toSave);
        toSave.forEach(saved ->
                auditService.log("LEAD_BULK_CREATE", "Bulk imported lead " + saved.getLeadId(), actor.getEmail())
        );

        return new BulkLeadResponse(toSave.size(), List.of());
    }

    public LeadFiltersResponse filters(String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        List<Lead> all = leadRepository.findByDeletedFalseOrderByCreatedAtDesc().stream()
                .filter(row -> canViewLead(actor, row, visibleGroupIds))
                .toList();

        Map<String, String> leadStatusLabelsByKey = new LinkedHashMap<>();
        leadStatusRepository.findByDeletedFalseOrderByCreatedAtDesc().stream()
                .map(LeadStatus::getStatusName)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .forEach(status -> leadStatusLabelsByKey.putIfAbsent(normalizeKey(status), status));
        all.stream()
                .map(Lead::getStatus)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .forEach(status -> leadStatusLabelsByKey.putIfAbsent(normalizeKey(status), status));

        Map<String, Long> leadStatusCountsByKey = all.stream()
                .map(Lead::getStatus)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .collect(Collectors.groupingBy(
                        this::normalizeKey,
                        LinkedHashMap::new,
                        Collectors.counting()
                ));
        LinkedHashMap<String, Long> orderedLeadStatusCounts = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : leadStatusLabelsByKey.entrySet()) {
            orderedLeadStatusCounts.put(entry.getValue(), leadStatusCountsByKey.getOrDefault(entry.getKey(), 0L));
        }

        LeadFiltersResponse out = new LeadFiltersResponse();
        out.setProjects(distinctSorted(all.stream().map(Lead::getProjectName).toList()));
        out.setPrimarySources(distinctSorted(all.stream().map(Lead::getPrimarySource).toList()));
        out.setLeadStatuses(new java.util.ArrayList<>(orderedLeadStatusCounts.keySet()));
        out.setLeadStatusCounts(orderedLeadStatusCounts);
        out.setSvStatuses(distinctSorted(all.stream().map(Lead::getSvStatus).toList()));
        out.setOwners(distinctSorted(all.stream().map(Lead::getOwner).toList()));
        return out;
    }

    @Transactional(readOnly = true)
    public List<LeadAssignableGroupResponse> listAssignableGroups(String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        List<UserGroup> groups;
        if (actor.getRole() == Role.SUPER_ADMIN) {
            // flow editor should be able to pick any group, even if the group
            // itself not yet marked as lead-visible.  previously the call
            // delegated to findLeadVisibleGroupsForActor which filtered out such
            // groups, causing freshly created groups to disappear from the dropdown.
            groups = userGroupRepository.findAllByOrderByNameAsc();
        } else {
            groups = findLeadVisibleGroupsForActor(actor);
        }
        return groups.stream()
                .map(this::toAssignableGroupResponse)
                .toList();
    }

    public LeadResponse create(LeadCreateRequest request, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Long flowGroupId = resolveFlowGroupForStatus(actor, "New Lead");
        // SUPER_ADMIN uses a branch selector on the frontend which sends the branch-specific
        // group as request.getLeadGroupId(). The global flow would otherwise override it with
        // a different group, causing eligibility checks to fail for branch-specific employees.
        Long groupId = (actor.getRole() == Role.SUPER_ADMIN && request.getLeadGroupId() != null)
                ? request.getLeadGroupId()
                : (flowGroupId != null ? flowGroupId : request.getLeadGroupId());
        UserGroup selectedGroup = resolveLeadGroupForCreate(actor, groupId);
        User ownerUser;
        if (actor.getRole() != Role.EMPLOYEE && request.getAssignedUserId() != null) {
            ownerUser = userRepository.findById(request.getAssignedUserId())
                    .orElseThrow(() -> new EntityNotFoundException("Assigned user not found"));
            if (!isValidManualLeadAssignee(ownerUser)) {
                throw new IllegalStateException("Assigned user is not an active employee or team lead");
            }
            boolean isEligibleForSelectedGroup = userGroupMemberRepository
                    .findByGroupAndUserId(selectedGroup, ownerUser.getId())
                    .filter(member -> member.getUser() != null)
                    .filter(member -> member.getUser().getRole() == Role.EMPLOYEE || member.getUser().getRole() == Role.TEAM_LEAD)
                    .filter(this::memberHasLeadVisibility)
                    .filter(member -> member.getUser().isActive())
                    .filter(member -> member.getUser().getActivationStatus() == ActivationStatus.ACTIVE)
                    .filter(member -> !member.getUser().isDeleted())
                    .isPresent();
            if (!isEligibleForSelectedGroup) {
                throw new IllegalStateException("Assigned user is not eligible for the selected lead group");
            }
        } else {
            ownerUser = resolveLeadOwnerForCreate(actor, selectedGroup);
        }

        String email = normalizeNullable(request.getEmail());
        String emailNormalized = normalizeEmail(email);
        String countryCode = normalizeNullable(request.getCountryCode());
        String mobile = request.getMobile().trim();
        String primarySource = request.getPrimarySource().trim();
        String secondarySource = normalizeNullable(request.getSecondarySource());
        String mobileNormalized = normalizeMobile(mobile);
        if (!StringUtils.hasText(mobileNormalized)) {
            throw new IllegalStateException("Mobile is required");
        }
        validateSecondarySourceForPrimary(primarySource, secondarySource);

        // Duplicate detection: check for an existing non-duplicate lead with same mobile or email
        Optional<Lead> existingMatch = leadRepository
                .findFirstByDeletedFalseAndIsDuplicateFalseAndMobileNormalizedOrderByCreatedAtDesc(mobileNormalized);
        if (existingMatch.isEmpty() && StringUtils.hasText(emailNormalized)) {
            existingMatch = leadRepository
                    .findFirstByDeletedFalseAndIsDuplicateFalseAndEmailNormalizedOrderByCreatedAtDesc(emailNormalized);
        }

        Lead row = new Lead();
        row.setLeadId("LEAD_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase(Locale.ROOT));
        row.setEuid(leadRepository.countByDeletedFalse() + 1);
        row.setName(request.getName().trim());
        row.setEmail(email);
        row.setEmailNormalized(emailNormalized);
        row.setCountryCode(countryCode);
        row.setMobile(mobile);
        row.setMobileNormalized(mobileNormalized);
        row.setPrimarySource(primarySource);
        row.setSecondarySource(secondarySource);
        row.setCompanyName(normalizeNullable(request.getCompanyName()));
        row.setProductType(normalizeNullable(request.getProductType()));
        row.setVariant(normalizeNullable(request.getVariant()));
        row.setQuantity(request.getQuantity());
        row.setLeadCountry(normalizeNullable(request.getLeadCountry()));
        row.setLeadState(normalizeNullable(request.getLeadState()));
        row.setLeadCity(normalizeNullable(request.getLeadCity()));
        row.setLeadPincode(normalizeNullable(request.getLeadPincode()));
        row.setStreetAddress(normalizeNullable(request.getStreetAddress()));
        row.setGstin(normalizeNullable(request.getGstin()));
        row.setStatus("New Lead");
        row.setSvStatus(null);
        row.setAssignedGroupId(selectedGroup.getId());
        row.setAllocatorUserId(actor.getId());
        row.setOwnerUserId(ownerUser.getId());
        row.setOwner(ownerUser.getUsername());

        // Mark as duplicate if a match was found
        existingMatch.ifPresent(existing -> {
            row.setDuplicate(true);
            row.setDuplicateOfLeadId(existing.getId());
            row.setDuplicateOfLeadRef(existing.getLeadId());
            row.setDuplicateOfLeadName(existing.getName());
        });

        Lead saved = leadRepository.save(row);
        if (isHigherOfficial(actor.getRole()) && ownerUser.getRole() == Role.EMPLOYEE) {
            sendLeadAssignmentEmails(saved, ownerUser, actor);
        }
        auditService.log("LEAD_CREATE", "Created lead with status " + saved.getStatus(), actor.getEmail());
        createLeadLog(saved.getId(), "Call Log Created", actor);

        Map<Long, String> groupNameMap = new HashMap<>();
        groupNameMap.put(selectedGroup.getId(), selectedGroup.getName());

        Map<Long, String> userNameMap = new HashMap<>();
        userNameMap.put(actor.getId(), actor.getUsername());
        userNameMap.put(ownerUser.getId(), ownerUser.getUsername());

        return toResponse(saved, groupNameMap, userNameMap);
    }

    public LeadResponse updateStatus(Long id, LeadUpdateStatusRequest request, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        Lead row = leadRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        if (!canViewLead(actor, row, visibleGroupIds)) {
            throw new AccessDeniedException("You do not have permission to update this lead");
        }
        if (!canEditLead(actor, row)) {
            throw new AccessDeniedException("Only the current owner can update status for this lead");
        }

        promoteLeadToRequirementStatusIfNeeded(row);
        String status = normalizeStatusAlias(request.getStatus());
        if (!isRecognizedLeadStatus(actor, row, status)) {
            throw new IllegalStateException("Invalid lead status");
        }
        if ("deal".equalsIgnoreCase(status)
                && row.getOwnerUserId() != null
                && row.getPreDealOwnerUserId() == null) {
            row.setPreDealOwnerUserId(row.getOwnerUserId());
        }
        applyFlowStatusTransition(actor, row, status, request.getNextGroupId());
        // when moving to Budget, set budget verification status PENDING and assign round-robin
        // NOTE: lead ownership is intentionally NOT changed; only budgetVerificationAssignedToUserId is set
        if ("budget".equalsIgnoreCase(status)) {
            row.setBudgetVerificationStatus("PENDING");
            assignBudgetRoundRobin(row);
        }
        if ("rejected".equalsIgnoreCase(status)) {
            row.setRejectedReason(normalizeNullable(request.getRejectedReason()));
            row.setRejectedReasonSubtype(normalizeNullable(request.getRejectedReasonSubtype()));
        } else {
            row.setRejectedReason(null);
            row.setRejectedReasonSubtype(null);
        }
        // Only clear paymentOwnerId for truly terminal statuses where the lead will never
        // return to payment. For all intermediate transitions (e.g. payment -> design ->
        // requirement -> payment), keep paymentOwnerId intact so the saved payment owner
        // is restored when the lead returns to payment later.
        // applyFlowStatusTransition is the single authority for ownership save/restore
        // via shouldTrackOwnerForStatus + applySavedOrRoundRobinOwner; duplicating or
        // overriding that logic here causes the two reassignment bugs:
        //   1) same-group transitions incorrectly fire round-robin
        //   2) saved payment owner gets wiped on intermediate status changes
        if ("deal".equalsIgnoreCase(status) || "rejected".equalsIgnoreCase(status)) {
            row.setPaymentOwnerId(null);
        }
        Lead saved = leadRepository.save(row);
        sendLeadStatusUpdateEmailSafely(saved);
        auditService.log("LEAD_STATUS_UPDATE", "Updated lead status", actor.getEmail());
        createLeadLog(saved.getId(), "Status changed to " + saved.getStatus(), actor);
        syncDealForLeadStatusSafely(saved, actor);

        Map<Long, String> groupNameMap = loadGroupNameMap(List.of(saved));
        Map<Long, String> userNameMap = loadUserNameMap(List.of(saved));

        return toResponse(saved, groupNameMap, userNameMap);
    }

    @Transactional(readOnly = true)
    public List<LeadAllocatorOptionResponse> listAssignableAllocators(Long leadId, Long targetGroupId, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        Lead lead = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        if (!canViewLead(actor, lead, visibleGroupIds)) {
            throw new AccessDeniedException("You do not have permission to access this lead");
        }

        Long effectiveGroupId = lead.getAssignedGroupId();
        if (targetGroupId != null) {
            Long allowedGroupId = resolveFlowNextGroupId(actor, lead, lead.getStatus(), "Allocate");
            if (allowedGroupId == null || !allowedGroupId.equals(targetGroupId)) {
                throw new AccessDeniedException("You do not have permission to assign this allocator");
            }
            effectiveGroupId = allowedGroupId;
        }

        boolean groupedLead = effectiveGroupId != null;
        if (actor.getRole() == Role.SUPER_ADMIN && groupedLead) {
            List<UserGroupMember> groupMembers = userGroupRepository.findById(effectiveGroupId)
                    .map(userGroupMemberRepository::findByGroupOrderByUserUsernameAsc)
                    .orElse(List.of());

            List<User> groupEmployees = groupMembers.stream()
                    .filter(this::memberHasLeadVisibility)
                    .map(UserGroupMember::getUser)
                    .filter(Objects::nonNull)
                    .filter(User::isActive)
                    .filter(user -> user.getActivationStatus() == ActivationStatus.ACTIVE)
                    .filter(user -> user.getRole() == Role.EMPLOYEE)
                    .toList();

            List<LeadAllocatorOptionResponse> out = new java.util.ArrayList<>(groupMembers.stream()
                    .filter(this::memberHasLeadVisibility)
                    .map(UserGroupMember::getUser)
                    .filter(Objects::nonNull)
                    .filter(User::isActive)
                    .filter(user -> user.getActivationStatus() == ActivationStatus.ACTIVE)
                    .map(this::toAllocatorOptionResponse)
                    .toList());

            Set<Long> seen = out.stream()
                    .map(LeadAllocatorOptionResponse::getId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            List<User> managersAdmins = userRepository
                    .findByRoleInAndActivationStatusAndIsDeletedFalseOrderByUsernameAsc(
                            List.of(Role.MANAGER, Role.ADMIN),
                            ActivationStatus.ACTIVE
                    ).stream()
                    .filter(User::isActive)
                    .filter(candidate -> (candidate.getRole() == Role.MANAGER && isAssociatedManager(candidate, groupEmployees))
                            || (candidate.getRole() == Role.ADMIN && isAssociatedAdmin(candidate, groupEmployees)))
                    .toList();

            for (User candidate : managersAdmins) {
                if (candidate.getId() == null || !seen.add(candidate.getId())) {
                    continue;
                }
                out.add(toAllocatorOptionResponse(candidate));
            }

            return out;
        }
        if ((actor.getRole() == Role.EMPLOYEE || actor.getRole() == Role.ADMIN || actor.getRole() == Role.MANAGER) && groupedLead) {
            if (actor.getRole() == Role.ADMIN || actor.getRole() == Role.MANAGER) {
                List<UserGroupMember> groupMembers = userGroupRepository.findById(effectiveGroupId)
                        .map(userGroupMemberRepository::findByGroupOrderByUserUsernameAsc)
                        .orElse(List.of());

                List<User> groupEmployees = groupMembers.stream()
                        .filter(this::memberHasLeadVisibility)
                        .map(UserGroupMember::getUser)
                        .filter(Objects::nonNull)
                        .filter(User::isActive)
                        .filter(user -> user.getActivationStatus() == ActivationStatus.ACTIVE)
                        .filter(user -> user.getRole() == Role.EMPLOYEE)
                        .toList();

                List<LeadAllocatorOptionResponse> out = new java.util.ArrayList<>(
                        groupEmployees.stream()
                                .map(this::toAllocatorOptionResponse)
                                .toList()
                );

                Set<Long> seen = out.stream()
                        .map(LeadAllocatorOptionResponse::getId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());

                if (actor.getRole() == Role.ADMIN) {
                    List<User> managers = userRepository
                            .findByRoleInAndActivationStatusAndIsDeletedFalseOrderByUsernameAsc(
                                    List.of(Role.MANAGER),
                                    ActivationStatus.ACTIVE
                            ).stream()
                            .filter(User::isActive)
                            .filter(candidate -> isAssociatedManager(candidate, groupEmployees))
                            .toList();
                    for (User candidate : managers) {
                        if (candidate.getId() == null || !seen.add(candidate.getId())) {
                            continue;
                        }
                        out.add(toAllocatorOptionResponse(candidate));
                    }
                }

                if (actor.getRole() == Role.MANAGER) {
                    List<User> admins = userRepository
                            .findByRoleInAndActivationStatusAndIsDeletedFalseOrderByUsernameAsc(
                                    List.of(Role.ADMIN),
                                    ActivationStatus.ACTIVE
                            ).stream()
                            .filter(User::isActive)
                            .filter(candidate -> isSameDepartmentScope(actor, candidate))
                            .toList();
                    for (User candidate : admins) {
                        if (candidate.getId() == null || !seen.add(candidate.getId())) {
                            continue;
                        }
                        out.add(toAllocatorOptionResponse(candidate));
                    }
                }

                return out;
            }
            List<LeadAllocatorOptionResponse> employees = userGroupMemberRepository
                    .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                            effectiveGroupId,
                            Role.EMPLOYEE,
                            ActivationStatus.ACTIVE
                    ).stream()
                    .filter(this::memberHasLeadVisibility)
                    .map(UserGroupMember::getUser)
                    .filter(Objects::nonNull)
                    .map(this::toAllocatorOptionResponse)
                    .toList();

            List<User> groupManagersAdmins = userGroupRepository.findById(effectiveGroupId)
                    .map(userGroupMemberRepository::findByGroupOrderByUserUsernameAsc)
                    .orElse(List.of())
                    .stream()
                    .filter(this::memberHasLeadVisibility)
                    .map(UserGroupMember::getUser)
                    .filter(Objects::nonNull)
                    .filter(user -> user.getRole() == Role.ADMIN || user.getRole() == Role.MANAGER)
                    .filter(User::isActive)
                    .filter(user -> user.getActivationStatus() == ActivationStatus.ACTIVE)
                    .toList();

            List<User> managersAdmins = userRepository
                    .findByRoleInAndActivationStatusAndIsDeletedFalseOrderByUsernameAsc(
                            List.of(Role.MANAGER, Role.ADMIN),
                            ActivationStatus.ACTIVE
                    ).stream()
                    .filter(User::isActive)
                    .filter(candidate -> (candidate.getRole() == Role.MANAGER && isSameTeamScope(actor, candidate))
                            || (candidate.getRole() == Role.ADMIN && isSameDepartmentScope(actor, candidate)))
                    .toList();

            List<LeadAllocatorOptionResponse> out = new java.util.ArrayList<>(employees);
            Set<Long> seen = new HashSet<>();
            for (LeadAllocatorOptionResponse res : out) {
                if (res.getId() != null) {
                    seen.add(res.getId());
                }
            }
            for (User candidate : groupManagersAdmins) {
                if (candidate.getId() != null && !seen.add(candidate.getId())) {
                    continue;
                }
                out.add(toAllocatorOptionResponse(candidate));
            }
            for (User candidate : managersAdmins) {
                if (candidate.getId() != null && !seen.add(candidate.getId())) {
                    continue;
                }
                out.add(toAllocatorOptionResponse(candidate));
            }
            return out;
        }

        List<User> candidates = userRepository.findByRoleInAndActivationStatusAndIsDeletedFalseOrderByUsernameAsc(
                RolePermissionUtil.getVisibleRoles(actor.getRole()),
                ActivationStatus.ACTIVE
        );

        Set<Long> groupedEligibleOwnerIds = groupedLead
                ? userGroupMemberRepository
                .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                        effectiveGroupId,
                        Role.EMPLOYEE,
                        ActivationStatus.ACTIVE
                ).stream()
                .filter(this::memberHasLeadVisibility)
                .map(UserGroupMember::getUser)
                .filter(Objects::nonNull)
                .map(User::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet())
                : Set.of();

        return candidates.stream()
                .filter(User::isActive)
                .filter(candidate -> canAssignAllocator(actor, candidate))
                .filter(candidate -> !groupedLead || groupedEligibleOwnerIds.contains(candidate.getId()))
                .map(this::toAllocatorOptionResponse)
                .toList();
    }

    public LeadResponse updateAllocator(Long leadId, LeadUpdateAllocatorRequest request, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        Lead row = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        if (!canViewLead(actor, row, visibleGroupIds)) {
            throw new AccessDeniedException("You do not have permission to update this lead");
        }

        if (request.getTargetGroupId() != null) {
            Long allowedGroupId = resolveFlowNextGroupId(actor, row, row.getStatus(), "Allocate");
            if (allowedGroupId == null || !allowedGroupId.equals(request.getTargetGroupId())) {
                throw new AccessDeniedException("You do not have permission to assign this allocator");
            }
            row.setAssignedGroupId(allowedGroupId);
        }

        if (actor.getRole() == Role.EMPLOYEE && !Objects.equals(row.getOwnerUserId(), actor.getId())) {
            throw new AccessDeniedException("Only the current owner can allocate this lead");
        }

        User ownerUser = userRepository.findByIdAndIsDeletedFalse(request.getOwnerUserId())
                .orElseThrow(() -> new EntityNotFoundException("Allocator user not found"));
        if (!ownerUser.isActive() || ownerUser.getActivationStatus() != ActivationStatus.ACTIVE) {
            throw new IllegalStateException("Selected allocator must be an active user");
        }
        if (actor.getRole() == Role.ADMIN || actor.getRole() == Role.MANAGER) {
            if (ownerUser.getRole() == Role.EMPLOYEE) {
                // allowed (group employee) - validated later
            } else if (actor.getRole() == Role.ADMIN && ownerUser.getRole() == Role.MANAGER) {
                if (!isAssociatedManager(ownerUser, loadGroupEmployees(row))) {
                    throw new AccessDeniedException("You do not have permission to assign this allocator");
                }
            } else if (actor.getRole() == Role.MANAGER && ownerUser.getRole() == Role.ADMIN) {
                if (!isSameDepartmentScope(actor, ownerUser)) {
                    throw new AccessDeniedException("You do not have permission to assign this allocator");
                }
            } else {
                throw new AccessDeniedException("You do not have permission to assign this allocator");
            }
        } else if (actor.getRole() == Role.EMPLOYEE && !canEmployeeAllocateTo(actor, ownerUser, row)) {
            throw new AccessDeniedException("You do not have permission to assign this allocator");
        } else if (actor.getRole() != Role.SUPER_ADMIN && actor.getRole() != Role.EMPLOYEE) {
            if (!canAssignAllocator(actor, ownerUser)) {
                throw new AccessDeniedException("You do not have permission to assign this allocator");
            }
        }

        if (actor.getRole() == Role.SUPER_ADMIN && row.getAssignedGroupId() != null) {
            List<User> groupEmployees = loadGroupEmployees(row);
            boolean allowed = false;
            if (ownerUser.getRole() == Role.EMPLOYEE) {
                allowed = groupEmployees.stream().anyMatch(emp -> Objects.equals(emp.getId(), ownerUser.getId()));
            } else if (ownerUser.getRole() == Role.MANAGER) {
                allowed = isAssociatedManager(ownerUser, groupEmployees);
            } else if (ownerUser.getRole() == Role.ADMIN) {
                allowed = isAssociatedAdmin(ownerUser, groupEmployees);
            }
            if (!allowed) {
                throw new AccessDeniedException("You do not have permission to assign this allocator");
            }
        }

        if (row.getAssignedGroupId() != null && ownerUser.getRole() == Role.EMPLOYEE && actor.getRole() != Role.SUPER_ADMIN) {
            List<UserGroupMember> eligibleOwners = userGroupMemberRepository
                    .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                            row.getAssignedGroupId(),
                            Role.EMPLOYEE,
                            ActivationStatus.ACTIVE
                    );
            boolean isEligible = eligibleOwners.stream()
                    .filter(this::memberHasLeadVisibility)
                    .map(UserGroupMember::getUser)
                    .filter(Objects::nonNull)
                    .anyMatch(member -> Objects.equals(member.getId(), ownerUser.getId()));
            if (!isEligible) {
                throw new IllegalStateException("Selected owner must be an active employee in the lead group");
            }
        }

        row.setOwnerUserId(ownerUser.getId());
        row.setOwner(ownerUser.getUsername());
        if (isHigherOfficial(actor.getRole())) {
            row.setAllocatorUserId(actor.getId());
        }
        Lead saved = leadRepository.save(row);
        if (isHigherOfficial(actor.getRole()) && ownerUser.getRole() == Role.EMPLOYEE) {
            sendLeadAssignmentEmails(saved, ownerUser, actor);
        }
        auditService.log("LEAD_ALLOCATOR_UPDATE", "Updated lead allocator", actor.getEmail());
        createLeadLog(saved.getId(), "Owner changed to " + ownerUser.getUsername(), actor);

        Map<Long, String> groupNameMap = loadGroupNameMap(List.of(saved));
        Map<Long, String> userNameMap = loadUserNameMap(List.of(saved));

        return toResponse(saved, groupNameMap, userNameMap);
    }

    public LeadResponse updateDetails(Long id, LeadUpdateDetailsRequest request, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        Lead row = leadRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        boolean relatedDealPaymentVerificationEdit =
                isPaymentVerificationUpdateRequest(request) && canEditRelatedDealPaymentVerification(actor, row);
        if (!canViewLead(actor, row, visibleGroupIds) && !relatedDealPaymentVerificationEdit) {
            throw new AccessDeniedException("You do not have permission to update this lead");
        }
        if (!canEditLead(actor, row) && !relatedDealPaymentVerificationEdit) {
            throw new AccessDeniedException("Only the current owner can edit this lead");
        }

        if (request.getAlternatePhone() != null) {
            row.setAlternatePhone(normalizeNullable(request.getAlternatePhone()));
        }
        if (request.getAlternateEmail() != null) {
            row.setAlternateEmail(normalizeNullable(request.getAlternateEmail()));
        }
        if (request.getCountryCode() != null) {
            row.setCountryCode(normalizeNullable(request.getCountryCode()));
        }
        if (request.getPrimarySource() != null) {
            row.setPrimarySource(normalizeNullable(request.getPrimarySource()));
        }
        if (request.getSecondarySource() != null) {
            row.setSecondarySource(normalizeNullable(request.getSecondarySource()));
        }
        if (request.getFollowUpDate() != null) {
            row.setFollowUpDate(request.getFollowUpDate());
        }
        if (request.getCompanyName() != null) {
            row.setCompanyName(normalizeNullable(request.getCompanyName()));
        }
        if (request.getEmail() != null) {
            String email = normalizeNullable(request.getEmail());
            row.setEmail(email);
            row.setEmailNormalized(normalizeEmail(email));
        }
        if (request.getMobile() != null) {
            String mobile = request.getMobile().trim();
            String mobileNormalized = normalizeMobile(mobile);
            if (!StringUtils.hasText(mobileNormalized)) {
                throw new IllegalStateException("Mobile is required");
            }
            row.setMobile(mobile);
            row.setMobileNormalized(mobileNormalized);
        }
        if (request.getProductType() != null) {
            row.setProductType(normalizeNullable(request.getProductType()));
        }
        if (request.getVariant() != null) {
            row.setVariant(normalizeNullable(request.getVariant()));
        }
        if (request.getQuantity() != null) {
            row.setQuantity(request.getQuantity());
        }
        if (request.getLeadCountry() != null) {
            row.setLeadCountry(normalizeNullable(request.getLeadCountry()));
        }
        if (request.getLeadState() != null) {
            row.setLeadState(normalizeNullable(request.getLeadState()));
        }
        if (request.getLeadCity() != null) {
            row.setLeadCity(normalizeNullable(request.getLeadCity()));
        }
        if (request.getLeadPincode() != null) {
            row.setLeadPincode(normalizeNullable(request.getLeadPincode()));
        }
        if (request.getStreetAddress() != null) {
            row.setStreetAddress(normalizeNullable(request.getStreetAddress()));
        }
        if (request.getGstin() != null) {
            row.setGstin(normalizeNullable(request.getGstin()));
        }
        validateSecondarySourceForPrimary(row.getPrimarySource(), row.getSecondarySource());
        if (request.getLeadType() != null) {
            String leadType = normalizeNullable(request.getLeadType());
            if (leadType != null && !leadTypeRepository.existsByTypeNameIgnoreCaseAndDeletedFalse(leadType)) {
                throw new IllegalStateException("Invalid lead type");
            }
            row.setLeadType(leadType);
        }
        if (request.getAttemptedOpenReason() != null) {
            row.setAttemptedOpenReason(normalizeNullable(request.getAttemptedOpenReason()));
        }
        if (request.getAttemptedCallStatus() != null) {
            row.setAttemptedCallStatus(normalizeNullable(request.getAttemptedCallStatus()));
        }
        if (request.getAttemptedCallRemarks() != null) {
            row.setAttemptedCallRemarks(normalizeNullable(request.getAttemptedCallRemarks()));
        }
        if (request.getNotAttemptedCallStatus() != null) {
            row.setNotAttemptedCallStatus(normalizeNullable(request.getNotAttemptedCallStatus()));
        }
        if (request.getNotAttemptedCallRemarks() != null) {
            row.setNotAttemptedCallRemarks(normalizeNullable(request.getNotAttemptedCallRemarks()));
        }
        if (request.getInterestedFollowUpDate() != null) {
            row.setInterestedFollowUpDate(request.getInterestedFollowUpDate());
        }
        if (request.getInterestedCallStatus() != null) {
            row.setInterestedCallStatus(normalizeNullable(request.getInterestedCallStatus()));
        }
        if (request.getInterestedCallRemarks() != null) {
            row.setInterestedCallRemarks(normalizeNullable(request.getInterestedCallRemarks()));
        }
        if (request.getRejectedReason() != null) {
            row.setRejectedReason(normalizeNullable(request.getRejectedReason()));
        }
        if (request.getRejectedReasonSubtype() != null) {
            row.setRejectedReasonSubtype(normalizeNullable(request.getRejectedReasonSubtype()));
        }
        // payment tracking fields
        if (request.getTotalAmount() != null) {
            row.setTotalAmount(request.getTotalAmount());
        }
        // Handle paid amount logic:
        // - On PENDING: save paymentVerificationAmount (the amount being verified), never touch paidAmount
        // - On APPROVED: add paymentVerificationAmount (stored from when request was submitted) to current paidAmount
        // - On REJECTED: no change to paidAmount
        // - No status change (manual edit): allow direct paidAmount update
        String newPaymentStatus = request.getPaymentVerificationStatus() != null ?
            normalizeNullable(request.getPaymentVerificationStatus()) : null;

        if ("PENDING".equals(newPaymentStatus)) {
            // Store the amount being requested for verification
            if (request.getPaymentVerificationAmount() != null) {
                row.setPaymentVerificationAmount(request.getPaymentVerificationAmount());
            } else if (request.getPaidAmount() != null) {
                // Fallback: if sent as paidAmount, store it as verificationAmount
                row.setPaymentVerificationAmount(request.getPaidAmount());
            }
            // Never touch the actual paidAmount on PENDING
        } else if ("APPROVED".equals(newPaymentStatus)) {
            // Add the stored verification amount to current paidAmount
            BigDecimal amountToAdd = row.getPaymentVerificationAmount() != null
                ? row.getPaymentVerificationAmount()
                : (request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO);
            if (amountToAdd.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal currentPaid = row.getPaidAmount() != null ? row.getPaidAmount() : BigDecimal.ZERO;
                row.setPaidAmount(currentPaid.add(amountToAdd));
                // Update remaining amount if totalAmount is set
                if (row.getTotalAmount() != null) {
                    BigDecimal newPaid = row.getPaidAmount();
                    BigDecimal remaining = row.getTotalAmount().subtract(newPaid);
                    row.setRemainingAmount(remaining.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : remaining);
                }
            }
            // Clear the pending verification amount after approval
            row.setPaymentVerificationAmount(null);
        } else if (newPaymentStatus == null) {
            // Manual edit with no verification status change — allow direct update
            if (request.getPaidAmount() != null) {
                row.setPaidAmount(request.getPaidAmount());
            }
        if (request.getPaymentVerificationAmount() != null) {
            row.setPaymentVerificationAmount(request.getPaymentVerificationAmount());
        }
        if (request.getBudgetInvoiceSent() != null) {
            row.setBudgetInvoiceSent(request.getBudgetInvoiceSent());
        }
        if (request.getPaymentInvoiceSent() != null) {
            row.setPaymentInvoiceSent(request.getPaymentInvoiceSent());
        }
        }
        // REJECTED: no changes to paid amounts
        if (request.getRemainingAmount() != null) {
            row.setRemainingAmount(request.getRemainingAmount());
        }
        if (request.getDesignStartAt() != null) {
            row.setDesignStartAt(request.getDesignStartAt());
        }
        if (request.getDesignEndAt() != null) {
            row.setDesignEndAt(request.getDesignEndAt());
        }
        if (request.getPaymentOwnerId() != null) {
            row.setPaymentOwnerId(request.getPaymentOwnerId());
        }
        if (request.getRequirementType() != null) {
            row.setRequirementType(normalizeNullable(request.getRequirementType()));
        }
        if (request.getRequirementFileName() != null) {
            row.setRequirementFileName(normalizeNullable(request.getRequirementFileName()));
        }
        if (request.getRequirementFilePath() != null) {
            row.setRequirementFilePath(normalizeNullable(request.getRequirementFilePath()));
        }
        if (request.getRequirementFileType() != null) {
            row.setRequirementFileType(normalizeNullable(request.getRequirementFileType()));
        }
        if (request.getRequirementFileSize() != null) {
            row.setRequirementFileSize(request.getRequirementFileSize());
        }
        if (request.getRequirementNotes() != null) {
            row.setRequirementNotes(normalizeNullable(request.getRequirementNotes()));
        }
        // payment verification fields
        if (request.getPaymentProofFileName() != null) {
            row.setPaymentProofFileName(normalizeNullable(request.getPaymentProofFileName()));
        }
        if (request.getPaymentProofFilePath() != null) {
            row.setPaymentProofFilePath(normalizeNullable(request.getPaymentProofFilePath()));
        }
        if (request.getPaymentProofNotes() != null) {
            row.setPaymentProofNotes(normalizeNullable(request.getPaymentProofNotes()));
        }
        if (request.getPaymentVerificationStatus() != null) {
            String newStatus = normalizeNullable(request.getPaymentVerificationStatus());
            row.setPaymentVerificationStatus(newStatus);
        }
        if (request.getPaymentVerificationRejectionReason() != null) {
            row.setPaymentVerificationRejectionReason(normalizeNullable(request.getPaymentVerificationRejectionReason()));
        }

        // payment verification address IDs
        if (request.getPaymentVerificationBillingAddressId() != null) {
            row.setPaymentVerificationBillingAddressId(request.getPaymentVerificationBillingAddressId());
        }
        if (request.getPaymentVerificationShippingAddressId() != null) {
            row.setPaymentVerificationShippingAddressId(request.getPaymentVerificationShippingAddressId());
        }
        if (request.getPaymentVerificationAssignedToUserId() != null) {
            row.setPaymentVerificationAssignedToUserId(request.getPaymentVerificationAssignedToUserId());
        }

        // payment details captured from payment verification
        if (request.getPaymentMethod() != null) {
            row.setPaymentMethod(normalizeNullable(request.getPaymentMethod()));
        }
        if (request.getTransactionId() != null) {
            row.setTransactionId(normalizeNullable(request.getTransactionId()));
        }
        if (request.getPaymentDate() != null) {
            row.setPaymentDate(request.getPaymentDate());
        }
        if (request.getPaymentNotes() != null) {
            row.setPaymentNotes(normalizeNullable(request.getPaymentNotes()));
        }
        if (request.getRejectionNotes() != null) {
            row.setRejectionNotes(normalizeNullable(request.getRejectionNotes()));
        }
        boolean invoiceUpdated = false;
        if (request.getInvoiceData() != null) {
            row.setInvoiceData(normalizeNullable(request.getInvoiceData()));
            invoiceUpdated = true;
        }
        if (request.getPaymentVerifiedInvoiceData() != null) {
            row.setPaymentVerifiedInvoiceData(normalizeNullable(request.getPaymentVerifiedInvoiceData()));
        }
        if (request.getInvoiceCgstPercent() != null) {
            row.setInvoiceCgstPercent(request.getInvoiceCgstPercent());
            invoiceUpdated = true;
        }
        if (request.getInvoiceSgstPercent() != null) {
            row.setInvoiceSgstPercent(request.getInvoiceSgstPercent());
            invoiceUpdated = true;
        }

        // Assign payment verification using round-robin whenever status becomes PENDING (including re-submissions after rejection)
        if (request.getPaymentVerificationStatus() != null && "PENDING".equals(normalizeNullable(request.getPaymentVerificationStatus()))) {
            assignPaymentVerificationRoundRobin(row);
        }

        // Handle budget verification status fields
        if (request.getBudgetVerificationStatus() != null) {
            row.setBudgetVerificationStatus(normalizeNullable(request.getBudgetVerificationStatus()));
        }
        if (request.getBudgetVerificationRejectionReason() != null) {
            row.setBudgetVerificationRejectionReason(normalizeNullable(request.getBudgetVerificationRejectionReason()));
        }
        if (request.getBudgetVerificationAssignedToUserId() != null) {
            row.setBudgetVerificationAssignedToUserId(request.getBudgetVerificationAssignedToUserId());
        }

        // Handle design requirement - parse designBrief JSON and save to DesignRequirement
        if (request.getDesignBrief() != null && !request.getDesignBrief().trim().isEmpty()) {
            try {
                Map<String, Object> designBriefMap = objectMapper.readValue(
                        request.getDesignBrief(),
                        new TypeReference<Map<String, Object>>() {}
                );

                DesignRequirementRequest designReqRequest = new DesignRequirementRequest();
                designReqRequest.setLeadId(id);
                designReqRequest.setRequirementType(normalizeNullable(request.getRequirementType()));
                designReqRequest.setRequirementNotes(normalizeNullable(request.getRequirementNotes()));
                designReqRequest.setRequirementFileName(normalizeNullable(request.getRequirementFileName()));
                designReqRequest.setRequirementFilePath(normalizeNullable(request.getRequirementFilePath()));

                Map<String, Object> productDetails = asMap(designBriefMap.get("productDetails"));
                designReqRequest.setDesignProductType(asString(productDetails.get("type")));
                designReqRequest.setDesignCustomProductType(asString(productDetails.get("customType")));
                designReqRequest.setDesignSize(asString(productDetails.get("size")));
                designReqRequest.setDesignCustomSize(asString(productDetails.get("customSize")));
                designReqRequest.setDesignOrientation(asString(productDetails.get("orientation")));
                designReqRequest.setDesignNumPages(asInteger(productDetails.get("pages")));

                Map<String, Object> designDetails = asMap(designBriefMap.get("designBrief"));
                designReqRequest.setDesignDescription(asString(designDetails.get("description")));
                designReqRequest.setDesignPurpose(asString(designDetails.get("purpose")));
                designReqRequest.setDesignCustomPurpose(asString(designDetails.get("customPurpose")));
                designReqRequest.setDesignTargetAudience(asString(designDetails.get("targetAudience")));
                designReqRequest.setDesignStylePref(asString(designDetails.get("stylePreference")));

                Map<String, Object> brandDetails = asMap(designBriefMap.get("brandDetails"));
                designReqRequest.setDesignBrandColors(asString(brandDetails.get("colors")));
                designReqRequest.setDesignFonts(asString(brandDetails.get("fonts")));
                Map<String, Object> guidelinesFile = asMap(brandDetails.get("guidelinesFile"));
                designReqRequest.setDesignBrandGuidelinesFileName(asString(guidelinesFile.get("fileName")));
                designReqRequest.setDesignBrandGuidelinesFilePath(asString(guidelinesFile.get("filePath")));

                Map<String, Object> content = asMap(designBriefMap.get("contentFromClient"));
                Map<String, Object> logo = asMap(content.get("logo"));
                designReqRequest.setDesignLogoFileName(asString(logo.get("fileName")));
                designReqRequest.setDesignLogoFilePath(asString(logo.get("filePath")));
                Map<String, Object> images = asMap(content.get("images"));
                designReqRequest.setDesignImagesFileName(asString(images.get("fileName")));
                designReqRequest.setDesignImagesFilePath(asString(images.get("filePath")));
                designReqRequest.setDesignTextContent(asString(content.get("textContent")));
                designReqRequest.setDesignWebsite(asString(content.get("website")));
                designReqRequest.setDesignPhone(asString(content.get("phone")));
                designReqRequest.setDesignPhoneCountryCode(asString(content.get("phoneCountryCode")));
                designReqRequest.setDesignAddress(asString(content.get("address")));
                designReqRequest.setDesignSocialMedia(asString(content.get("socialMedia")));
                designReqRequest.setDesignQrCode(asString(content.get("qrCode")));

                Map<String, Object> refs = asMap(designBriefMap.get("referenceDesigns"));
                Map<String, Object> refImages = asMap(refs.get("images"));
                designReqRequest.setDesignReferenceImagesFileName(asString(refImages.get("fileName")));
                designReqRequest.setDesignReferenceImagesFilePath(asString(refImages.get("filePath")));
                designReqRequest.setDesignReferenceLinks(asString(refs.get("links")));
                Map<String, Object> prevDesigns = asMap(refs.get("previousDesigns"));
                designReqRequest.setDesignPreviousDesignsFileName(asString(prevDesigns.get("fileName")));
                designReqRequest.setDesignPreviousDesignsFilePath(asString(prevDesigns.get("filePath")));

                Map<String, Object> deadline = asMap(designBriefMap.get("deadline"));
                designReqRequest.setDesignDeadline(parseDateTimeOrDate(deadline.get("date")));
                designReqRequest.setDesignPriority(asString(deadline.get("priority")));
                designReqRequest.setDesignCustomPriority(asString(deadline.get("customPriority")));

                Map<String, Object> special = asMap(designBriefMap.get("specialInstructions"));
                designReqRequest.setDesignAdditionalNotes(asString(special.get("notes")));
                designReqRequest.setDesignRestrictions(asString(special.get("restrictions")));
                designReqRequest.setDesignColorPrefs(asString(special.get("colorPreferences")));

                designRequirementService.saveDesignRequirement(designReqRequest, actor.getId());
            } catch (Exception e) {
                logger.error("Failed to parse and save design brief: {}", e.getMessage(), e);
                // Do not fail lead update if design brief parsing fails.
            }
        }

        // Handle production requirement - parse productionBrief JSON and save to ProductionRequirement
        if (request.getProductionBrief() != null && !request.getProductionBrief().trim().isEmpty()) {
            try {
                Map<String, Object> productionBriefMap = objectMapper.readValue(
                        request.getProductionBrief(),
                        new TypeReference<Map<String, Object>>() {}
                );
                
                ProductionRequirementRequest prodReqRequest = new ProductionRequirementRequest();
                prodReqRequest.setLeadId(id);
                prodReqRequest.setRequirementType(normalizeNullable(request.getRequirementType()));
                prodReqRequest.setRequirementNotes(normalizeNullable(request.getRequirementNotes()));
                prodReqRequest.setRequirementFileName(normalizeNullable(request.getRequirementFileName()));
                prodReqRequest.setRequirementFilePath(normalizeNullable(request.getRequirementFilePath()));
                
                // Map productDetails section
                if (productionBriefMap.containsKey("productDetails")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> productDetails = (Map<String, Object>) productionBriefMap.get("productDetails");
                    if (productDetails != null) {
                        prodReqRequest.setProductType(asString(productDetails.get("type")));
                        prodReqRequest.setCustomProductType(asString(productDetails.get("customProductType")));
                        Object qtyObj = productDetails.get("quantity");
                        prodReqRequest.setQuantity(asInteger(qtyObj));
                        Object pagesObj = productDetails.get("pages");
                        prodReqRequest.setNumPages(asInteger(pagesObj));
                    }
                }
                
                // Map sizeDetails section
                if (productionBriefMap.containsKey("sizeDetails")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> sizeDetails = (Map<String, Object>) productionBriefMap.get("sizeDetails");
                    if (sizeDetails != null) {
                        prodReqRequest.setPaperSize(asString(sizeDetails.get("size")));
                        prodReqRequest.setCustomSizeWidth(asDouble(sizeDetails.get("customWidth")));
                        prodReqRequest.setCustomSizeHeight(asDouble(sizeDetails.get("customHeight")));
                        prodReqRequest.setCustomSizeUnit(asString(sizeDetails.get("customUnit")));
                    }
                }
                
                // Map paperSpecifications section
                if (productionBriefMap.containsKey("paperSpecifications")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> paperSpecs = (Map<String, Object>) productionBriefMap.get("paperSpecifications");
                    if (paperSpecs != null) {
                        prodReqRequest.setPaperType(asString(paperSpecs.get("type")));
                        prodReqRequest.setPaperGsm(asString(paperSpecs.get("gsm")));
                    }
                }
                
                // Map printingSpecifications section
                if (productionBriefMap.containsKey("printingSpecifications")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> printSpecs = (Map<String, Object>) productionBriefMap.get("printingSpecifications");
                    if (printSpecs != null) {
                        prodReqRequest.setColorType(asString(printSpecs.get("colorType")));
                        prodReqRequest.setPrintSides(asString(printSpecs.get("printSides")));
                        prodReqRequest.setPrintingMethod(asString(printSpecs.get("printingMethod")));
                    }
                }
                
                // Map finishingOptions section
                if (productionBriefMap.containsKey("finishingOptions")) {
                    Object finishingObj = productionBriefMap.get("finishingOptions");
                    if (finishingObj != null) {
                        if (finishingObj instanceof String) {
                            prodReqRequest.setFinishingOptions((String) finishingObj);
                        } else {
                            prodReqRequest.setFinishingOptions(objectMapper.writeValueAsString(finishingObj));
                        }
                    }
                }
                
                // Map foldingType
                prodReqRequest.setFoldingType(asString(productionBriefMap.get("foldingType")));
                
                // Map artworkUpload section (legacy shape)
                if (productionBriefMap.containsKey("artworkUpload")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> artwork = (Map<String, Object>) productionBriefMap.get("artworkUpload");
                    if (artwork != null) {
                        prodReqRequest.setArtworkFileName(asString(artwork.get("fileName")));
                        prodReqRequest.setArtworkFilePath(asString(artwork.get("filePath")));
                    }
                }
                // Map artworkFile (current frontend shape)
                String artworkFile = asString(productionBriefMap.get("artworkFile"));
                if (StringUtils.hasText(artworkFile)) {
                    if (artworkFile.contains("/") || artworkFile.contains("\\")) {
                        prodReqRequest.setArtworkFilePath(artworkFile);
                        prodReqRequest.setArtworkFileName(toFileName(artworkFile));
                    } else if (!StringUtils.hasText(prodReqRequest.getArtworkFileName())) {
                        prodReqRequest.setArtworkFileName(artworkFile);
                    }
                }
                
                prodReqRequest.setAdditionalNotes(asString(productionBriefMap.get("additionalNotes")));
                
                // Map deadline & delivery section
                if (productionBriefMap.containsKey("deadline")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> deadline = (Map<String, Object>) productionBriefMap.get("deadline");
                    if (deadline != null) {
                        prodReqRequest.setProductionPrintDeadline(parseDateTimeOrDate(deadline.get("printDeadline")));
                        prodReqRequest.setProductionDeliveryDate(parseDateTimeOrDate(deadline.get("deliveryDate")));
                        prodReqRequest.setPriority(asString(deadline.get("priority")));
                    }
                }
                
                // Save production requirement
                productionRequirementService.saveProductionRequirement(prodReqRequest, actor.getId());
            } catch (Exception e) {
                logger.error("Failed to parse and save production brief: " + e.getMessage(), e);
                // Don't fail the entire request if production brief parsing fails
            }
        }


        Lead saved = leadRepository.save(row);
        // Sync invoice data to the deal if it was updated (keeps deal in sync after payment approvals)
        if (invoiceUpdated) {
            dealService.syncInvoiceDataToDeals(saved.getId(), saved.getInvoiceData(), saved.getInvoiceCgstPercent(), saved.getInvoiceSgstPercent());
        }
        dealService.syncInvoiceSentFlagsToDeal(saved.getId(), saved.isBudgetInvoiceSent(), saved.isPaymentInvoiceSent());
        if (StringUtils.hasText(saved.getPaymentProofFileName()) && StringUtils.hasText(saved.getPaymentProofFilePath())
                && (StringUtils.hasText(request.getPaymentProofFileName()) || StringUtils.hasText(request.getPaymentProofFilePath()))) {
            createLeadLog(saved.getId(), "Payment proof uploaded", actor, saved.getPaymentProofFileName(), saved.getPaymentProofFilePath());
        }
        if (StringUtils.hasText(request.getBudgetInvoiceFileName()) && StringUtils.hasText(request.getBudgetInvoiceFilePath())) {
            createLeadLog(saved.getId(), "Budget invoice uploaded", actor, request.getBudgetInvoiceFileName(), request.getBudgetInvoiceFilePath());
        }
        if (StringUtils.hasText(request.getPaymentVerificationInvoiceFileName()) && StringUtils.hasText(request.getPaymentVerificationInvoiceFilePath())) {
            createLeadLog(saved.getId(), "Payment verification invoice uploaded", actor, request.getPaymentVerificationInvoiceFileName(), request.getPaymentVerificationInvoiceFilePath());
        }
        auditService.log("LEAD_DETAILS_UPDATE", "Updated lead details", actor.getEmail());
        createLeadLog(saved.getId(), "Lead details updated", actor);

        Map<Long, String> groupNameMap = loadGroupNameMap(List.of(saved));
        Map<Long, String> userNameMap = loadUserNameMap(List.of(saved));

        return toResponse(saved, groupNameMap, userNameMap);
    }

    @Transactional(readOnly = true)
    public List<LeadInvoiceItem> getInvoiceItems(Long leadId, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Lead lead = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        if (!canViewLead(actor, lead, visibleGroupIds)) {
            throw new AccessDeniedException("You do not have permission to access this lead");
        }
        return leadInvoiceItemRepository.findByLeadIdOrderBySortOrderAsc(leadId);
    }

    @Transactional
    public List<LeadInvoiceItem> saveInvoiceItems(Long leadId, List<Map<String, Object>> itemsData,
                                                  BigDecimal cgstPercent, BigDecimal sgstPercent,
                                                  String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Lead lead = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        if (!canViewLead(actor, lead, visibleGroupIds)) {
            throw new AccessDeniedException("You do not have permission to access this lead");
        }

        // Replace all existing items for this lead
        leadInvoiceItemRepository.deleteByLeadId(leadId);

        List<LeadInvoiceItem> result = new java.util.ArrayList<>();
        for (int i = 0; i < (itemsData == null ? 0 : itemsData.size()); i++) {
            Map<String, Object> data = itemsData.get(i);
            LeadInvoiceItem item = new LeadInvoiceItem();
            item.setLeadId(leadId);
            item.setDescription(String.valueOf(data.getOrDefault("description", "")));
            item.setHsn(data.get("hsn") != null ? String.valueOf(data.get("hsn")) : null);
            BigDecimal qty = toBigDecimal(data.get("quantity"));
            BigDecimal price = toBigDecimal(data.get("unitPrice"));
            item.setQuantity(qty);
            item.setUnitPrice(price);
            item.setSubtotal(qty.multiply(price));
            item.setSortOrder(i);
            result.add(leadInvoiceItemRepository.save(item));
        }

        // Update CGST/SGST on the lead
        if (cgstPercent != null) lead.setInvoiceCgstPercent(cgstPercent);
        if (sgstPercent != null) lead.setInvoiceSgstPercent(sgstPercent);
        leadRepository.save(lead);

        auditService.log("LEAD_INVOICE_ITEMS_SAVED", "Saved invoice items for lead " + leadId, actor.getEmail());
        return result;
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof Number) return new BigDecimal(val.toString());
        try { return new BigDecimal(String.valueOf(val)); } catch (Exception e) { return BigDecimal.ZERO; }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private String asString(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private Integer asInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (Exception ex) {
            return null;
        }
    }

    private Double asDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value).trim());
        } catch (Exception ex) {
            return null;
        }
    }

    private LocalDateTime parseDateTimeOrDate(Object value) {
        String text = asString(value);
        if (!StringUtils.hasText(text)) return null;
        try {
            return LocalDateTime.parse(text);
        } catch (Exception ignored) {
        }
        try {
            return LocalDate.parse(text).atStartOfDay();
        } catch (Exception ignored) {
        }
        return null;
    }

    private String toFileName(String pathValue) {
        String value = asString(pathValue);
        if (!StringUtils.hasText(value)) return null;
        int slashIdx = Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\'));
        if (slashIdx >= 0 && slashIdx + 1 < value.length()) {
            return value.substring(slashIdx + 1);
        }
        return value;
    }

    public Map<String, Object> uploadPaymentProof(Long id, MultipartFile file, String actorPrincipal) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        Lead row = leadRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        if (!canViewLead(actor, row, visibleGroupIds)) {
            throw new AccessDeniedException("You do not have permission to update this lead");
        }

        try {
            return storeLeadFile(id, file, "payment-proofs", "payment-proof");
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to upload payment proof file");
        }
    }

    public Map<String, Object> uploadPaymentProofFromDeal(Long id, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        Lead row = leadRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));

        try {
            return storeLeadFile(row.getId(), file, "payment-proofs", "payment-proof");
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to upload payment proof file");
        }
    }

    public Map<String, Object> uploadLeadLogFile(Long id, MultipartFile file, String actorPrincipal) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        Lead row = leadRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        if (!canViewLead(actor, row, visibleGroupIds)) {
            throw new AccessDeniedException("You do not have permission to update this lead");
        }

        try {
            return storeLeadFile(id, file, "lead-log-files", "lead-log-file");
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to upload lead log file");
        }
    }

    public void deleteLead(Long id, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        Lead row = leadRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        if (!canViewLead(actor, row, visibleGroupIds)) {
            throw new AccessDeniedException("You do not have permission to delete this lead");
        }
        if (actor.getRole() == Role.EMPLOYEE) {
            throw new AccessDeniedException("You do not have permission to delete this lead");
        }
        row.setDeleted(true);
        leadRepository.save(row);
        auditService.log("LEAD_DELETE", "Deleted lead " + row.getLeadId(), actor.getEmail());
        createLeadLog(row.getId(), "Lead deleted", actor);
    }

    @Transactional(readOnly = true)
    public LeadResponse getCustomerLead(String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("You do not have permission to access customer leads");
        }
        if (!StringUtils.hasText(actor.getEmail())) {
            throw new EntityNotFoundException("Customer email not found");
        }
        String email = actor.getEmail().trim().toLowerCase(Locale.ROOT);
        Lead lead = leadRepository
                .findTopByDeletedFalseAndEmailNormalizedOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));

        Map<Long, String> groupNameMap = loadGroupNameMap(List.of(lead));
        Map<Long, String> userNameMap = loadUserNameMap(List.of(lead));
        return toResponse(lead, groupNameMap, userNameMap);
    }

    public LeadResponse updateCustomerLeadStatus(LeadUpdateStatusRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.CUSTOMER) {
            throw new AccessDeniedException("You do not have permission to update lead status");
        }
        if (request == null || !StringUtils.hasText(request.getStatus())) {
            throw new IllegalStateException("Status is required");
        }
        Lead lead = findCustomerLead(actor);
        String status = normalizeStatusAlias(request.getStatus());
        if (!isRecognizedLeadStatus(actor, lead, status)) {
            throw new IllegalStateException("Invalid lead status");
        }
        if (!"payment".equalsIgnoreCase(status) && !"rejected".equalsIgnoreCase(status)) {
            throw new IllegalStateException("Customer can only select Payment or Rejected");
        }
        if ("rejected".equalsIgnoreCase(status) && !StringUtils.hasText(request.getRejectedReason())) {
            throw new IllegalStateException("Rejected reason is required");
        }

        applyFlowStatusTransition(actor, lead, status, null);
        if ("rejected".equalsIgnoreCase(status)) {
            lead.setRejectedReason(normalizeNullable(request.getRejectedReason()));
            lead.setRejectedReasonSubtype(normalizeNullable(request.getRejectedReasonSubtype()));
        } else {
            lead.setRejectedReason(null);
            lead.setRejectedReasonSubtype(null);
        }
        Lead saved = leadRepository.save(lead);
        sendLeadStatusUpdateEmailSafely(saved);
        auditService.log("LEAD_STATUS_UPDATE", "Customer updated lead status to " + status, actor.getEmail());
        createLeadLog(saved.getId(), "Status changed to " + saved.getStatus(), actor);

        Map<Long, String> groupNameMap = loadGroupNameMap(List.of(saved));
        Map<Long, String> userNameMap = loadUserNameMap(List.of(saved));
        return toResponse(saved, groupNameMap, userNameMap);
    }

    private Lead findCustomerLead(User actor) {
        if (actor == null || !StringUtils.hasText(actor.getEmail())) {
            throw new EntityNotFoundException("Lead not found");
        }
        String email = actor.getEmail().trim().toLowerCase(Locale.ROOT);
        return leadRepository
                .findTopByDeletedFalseAndEmailNormalizedOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
    }

    private boolean isRecognizedLeadStatus(User actor, Lead row, String status) {
        if (!StringUtils.hasText(status)) {
            return false;
        }
        String normalizedStatus = normalizeStatusAlias(status);
        if (leadStatusRepository.existsByStatusNameIgnoreCaseAndDeletedFalse(normalizedStatus)) {
            return true;
        }
        if (row != null && StringUtils.hasText(row.getStatus())
                && normalizeStatusAlias(row.getStatus()).equalsIgnoreCase(normalizedStatus)) {
            return true;
        }
        List<Map<String, Object>> rules = getFlowRulesForLeadScope(actor, row);
        if (rules == null || rules.isEmpty()) {
            return false;
        }
        for (Map<String, Object> rule : rules) {
            if (rule == null) continue;
            Object currentStatus = rule.get("status");
            if (currentStatus != null && normalizeStatusAlias(currentStatus.toString()).equalsIgnoreCase(normalizedStatus)) {
                return true;
            }
            Object nextObj = rule.get("next");
            if (nextObj instanceof Map<?, ?> nextMap) {
                for (Object key : nextMap.keySet()) {
                    if (key != null && normalizeStatusAlias(key.toString()).equalsIgnoreCase(normalizedStatus)) {
                        return true;
                    }
                }
            }
            Object allowedNext = rule.get("allowedNext");
            if (allowedNext instanceof List<?> allowedStatuses) {
                for (Object item : allowedStatuses) {
                    if (item != null && normalizeStatusAlias(item.toString()).equalsIgnoreCase(normalizedStatus)) {
                        return true;
                    }
                }
            }
            Object nextStatuses = rule.get("nextStatuses");
            if (nextStatuses instanceof List<?> list) {
                for (Object item : list) {
                    if (item != null && normalizeStatusAlias(item.toString()).equalsIgnoreCase(normalizedStatus)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private User assertLeadAccess(String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.SUPER_ADMIN
                && actor.getRole() != Role.ADMIN
                && actor.getRole() != Role.MANAGER
                && actor.getRole() != Role.TEAM_LEAD
                && actor.getRole() != Role.EMPLOYEE) {
            throw new AccessDeniedException("You do not have permission to access leads");
        }
        if (actor.getRole() == Role.EMPLOYEE && findLeadRecordVisibleGroupsForActor(actor).isEmpty()) {
            throw new AccessDeniedException("No lead-accessible group is assigned to your account");
        }
        return actor;
    }

    private User resolveActor(String actorPrincipal) {
        if (!StringUtils.hasText(actorPrincipal)) {
            throw new AccessDeniedException("Unauthenticated actor");
        }
        if (actorPrincipal.contains("@")) {
            return userRepository.findByEmailAndIsDeletedFalse(actorPrincipal.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
        }
        return userRepository.findByUsernameAndIsDeletedFalse(actorPrincipal.trim())
                .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
    }

    private List<UserGroup> findLeadVisibleGroupsForActor(User actor) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return userGroupRepository.findAllByOrderByNameAsc().stream()
                    .filter(this::hasLeadVisibility)
                    .toList();
        }

        if (actor.getRole() == Role.ADMIN) {
            return userGroupRepository
                    .findByInstitutionNameIgnoreCaseOrderByNameAsc(actor.getInstitutionName())
                    .stream()
                    .filter(this::hasLeadVisibility)
                    .toList();
        }

        if (actor.getRole() == Role.MANAGER) {
            return userGroupRepository
                    .findByInstitutionNameIgnoreCaseOrderByNameAsc(actor.getInstitutionName())
                    .stream()
                    .filter(this::hasLeadVisibility)
                    .filter(group -> isSameDepartmentScope(actor, group))
                    .toList();
        }

        if (actor.getRole() == Role.TEAM_LEAD) {
            return userGroupRepository
                    .findByInstitutionNameIgnoreCaseOrderByNameAsc(actor.getInstitutionName())
                    .stream()
                    .filter(this::hasLeadVisibility)
                    .filter(group -> isSameDepartmentScope(actor, group))
                    .filter(group -> groupIncludesTeam(group, actor.getTeamName()))
                    .toList();
        }

        if (actor.getRole() == Role.EMPLOYEE) {
            Map<Long, UserGroup> byId = new LinkedHashMap<>();
            for (UserGroupMember membership : userGroupMemberRepository.findByUser_IdOrderByIdAsc(actor.getId())) {
                UserGroup group = membership.getGroup();
                if (group != null
                        && group.getId() != null
                        && hasLeadVisibility(group)
                        && memberHasLeadVisibility(membership)) {
                    byId.putIfAbsent(group.getId(), group);
                }
            }
            return byId.values().stream()
                    .sorted(GROUP_ORDER_COMPARATOR)
                    .toList();
        }

        return List.of();
    }

    private List<UserGroup> findLeadRecordVisibleGroupsForActor(User actor) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return userGroupRepository.findAllByOrderByNameAsc().stream()
                    .filter(this::hasLeadRecordVisibility)
                    .toList();
        }

        if (actor.getRole() == Role.ADMIN) {
            return userGroupRepository
                    .findByInstitutionNameIgnoreCaseOrderByNameAsc(actor.getInstitutionName())
                    .stream()
                    .filter(this::hasLeadRecordVisibility)
                    .toList();
        }

        if (actor.getRole() == Role.MANAGER) {
            return userGroupRepository
                    .findByInstitutionNameIgnoreCaseOrderByNameAsc(actor.getInstitutionName())
                    .stream()
                    .filter(this::hasLeadRecordVisibility)
                    .filter(group -> groupIncludesTeam(group, actor.getTeamName()))
                    .toList();
        }

        if (actor.getRole() == Role.TEAM_LEAD) {
            return userGroupRepository
                    .findByInstitutionNameIgnoreCaseOrderByNameAsc(actor.getInstitutionName())
                    .stream()
                    .filter(this::hasLeadRecordVisibility)
                    .filter(group -> groupIncludesTeam(group, actor.getTeamName()))
                    .toList();
        }

        if (actor.getRole() == Role.EMPLOYEE) {
            Map<Long, UserGroup> byId = new LinkedHashMap<>();
            for (UserGroupMember membership : userGroupMemberRepository.findByUser_IdOrderByIdAsc(actor.getId())) {
                UserGroup group = membership.getGroup();
                if (group != null
                        && group.getId() != null
                        && hasLeadRecordVisibility(group)
                        && memberHasLeadRecordVisibility(membership)) {
                    byId.putIfAbsent(group.getId(), group);
                }
            }
            return byId.values().stream()
                    .sorted(GROUP_ORDER_COMPARATOR)
                    .toList();
        }

        return List.of();
    }

    private Set<Long> resolveVisibleLeadGroupIds(User actor) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return Set.of();
        }
        return findLeadRecordVisibleGroupsForActor(actor).stream()
                .map(UserGroup::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private boolean canViewLead(User actor, Lead row, Set<Long> visibleGroupIds) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.EMPLOYEE) {
            // employees see leads they currently own
            if (row.getOwnerUserId() != null && Objects.equals(row.getOwnerUserId(), actor.getId())) {
                return true;
            }
            if (canDealEmployeeAccessPaymentVerification(actor, row)) {
                return true;
            }
            // Keep only the lead that this employee actually handled before deal conversion.
            if ("deal".equalsIgnoreCase(row.getStatus())
                    && row.getPreDealOwnerUserId() != null
                    && Objects.equals(row.getPreDealOwnerUserId(), actor.getId())) {
                return true;
            }
            // during design/production the payment handler still has read access
            if (("design".equalsIgnoreCase(row.getStatus()) || "production".equalsIgnoreCase(row.getStatus()))
                    && row.getPaymentOwnerId() != null
                    && Objects.equals(row.getPaymentOwnerId(), actor.getId())) {
                return true;
            }
            // budget verification: assigned employee can see the lead while verification is pending
            if (row.getBudgetVerificationAssignedToUserId() != null
                    && Objects.equals(row.getBudgetVerificationAssignedToUserId(), actor.getId())
                    && "PENDING".equalsIgnoreCase(row.getBudgetVerificationStatus())) {
                return true;
            }
            // payment verification: assigned employee can access the lead for the
            // initial submission, pending review, and re-submission after rejection.
            if (canEmployeeAccessPaymentVerification(actor, row)) {
                return true;
            }
            return false;
        }
        if (actor.getRole() == Role.ADMIN) {
            if (row.getAssignedGroupId() != null && visibleGroupIds.contains(row.getAssignedGroupId())) {
                return true;
            }
            if (row.getOwnerUserId() != null) {
                List<UserGroupMember> ownerMemberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(row.getOwnerUserId());
                if (ownerMemberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                    return true;
                }
            }
            if (row.getBudgetVerificationAssignedToUserId() != null && !visibleGroupIds.isEmpty()) {
                List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(row.getBudgetVerificationAssignedToUserId());
                if (memberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                    return true;
                }
            }
            if (row.getPaymentVerificationAssignedToUserId() != null && !visibleGroupIds.isEmpty()) {
                List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(row.getPaymentVerificationAssignedToUserId());
                if (memberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                    return true;
                }
            }
            if (row.getOwnerUserId() != null) {
                return Objects.equals(row.getOwnerUserId(), actor.getId())
                        || textEquals(row.getOwner(), actor.getUsername());
            }
            return textEquals(row.getOwner(), actor.getUsername());
        }
        if (actor.getRole() == Role.MANAGER) {
            if (row.getAssignedGroupId() != null && visibleGroupIds.contains(row.getAssignedGroupId())) {
                return true;
            }
            if (row.getOwnerUserId() != null && !visibleGroupIds.isEmpty()) {
                List<UserGroupMember> ownerMemberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(row.getOwnerUserId());
                if (ownerMemberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                    return true;
                }
            }
            if ("deal".equalsIgnoreCase(row.getStatus()) && !visibleGroupIds.isEmpty()) {
                for (Long pastOwnerId : new Long[]{row.getPaymentOwnerId(), row.getDesignOwnerId(), row.getProductionOwnerId()}) {
                    if (pastOwnerId != null) {
                        List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(pastOwnerId);
                        if (memberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                            return true;
                        }
                    }
                }
            }
            if (row.getBudgetVerificationAssignedToUserId() != null && !visibleGroupIds.isEmpty()) {
                List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(row.getBudgetVerificationAssignedToUserId());
                if (memberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                    return true;
                }
            }
            if (row.getPaymentVerificationAssignedToUserId() != null && !visibleGroupIds.isEmpty()) {
                List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(row.getPaymentVerificationAssignedToUserId());
                if (memberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                    return true;
                }
            }
            if (row.getOwnerUserId() != null) {
                return Objects.equals(row.getOwnerUserId(), actor.getId())
                        || textEquals(row.getOwner(), actor.getUsername());
            }
            return textEquals(row.getOwner(), actor.getUsername());
        }
        if (actor.getRole() == Role.TEAM_LEAD) {
            if (row.getAssignedGroupId() != null && visibleGroupIds.contains(row.getAssignedGroupId())) {
                return true;
            }
            if (row.getOwnerUserId() != null && !visibleGroupIds.isEmpty()) {
                List<UserGroupMember> ownerMemberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(row.getOwnerUserId());
                if (ownerMemberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                    return true;
                }
            }
            if ("deal".equalsIgnoreCase(row.getStatus()) && !visibleGroupIds.isEmpty()) {
                for (Long pastOwnerId : new Long[]{row.getPaymentOwnerId(), row.getDesignOwnerId(), row.getProductionOwnerId()}) {
                    if (pastOwnerId != null) {
                        List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(pastOwnerId);
                        if (memberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                            return true;
                        }
                    }
                }
            }
            if (row.getBudgetVerificationAssignedToUserId() != null && !visibleGroupIds.isEmpty()) {
                List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(row.getBudgetVerificationAssignedToUserId());
                if (memberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                    return true;
                }
            }
            if (row.getPaymentVerificationAssignedToUserId() != null && !visibleGroupIds.isEmpty()) {
                List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(row.getPaymentVerificationAssignedToUserId());
                if (memberships.stream().anyMatch(m -> m.getGroup() != null && visibleGroupIds.contains(m.getGroup().getId()))) {
                    return true;
                }
            }
            if (row.getOwnerUserId() != null) {
                return Objects.equals(row.getOwnerUserId(), actor.getId())
                        || textEquals(row.getOwner(), actor.getUsername());
            }
            return textEquals(row.getOwner(), actor.getUsername());
        }
        if (row.getAssignedGroupId() != null && visibleGroupIds.contains(row.getAssignedGroupId())) {
            return true;
        }
        if (row.getOwnerUserId() != null) {
            return Objects.equals(row.getOwnerUserId(), actor.getId());
        }
        return textEquals(row.getOwner(), actor.getUsername());
    }

    private boolean canEditLead(User actor, Lead row) {
        if (actor.getRole() == Role.SUPER_ADMIN
                || actor.getRole() == Role.ADMIN
                || actor.getRole() == Role.MANAGER
                || actor.getRole() == Role.TEAM_LEAD) {
            return true;
        }
        if (actor.getRole() == Role.EMPLOYEE) {
            if (row.getOwnerUserId() != null && row.getOwnerUserId().equals(actor.getId())) return true;
            if (canDealEmployeeAccessPaymentVerification(actor, row)) return true;
            // budget-assigned employee can update budget verification fields while pending
            if (row.getBudgetVerificationAssignedToUserId() != null
                    && row.getBudgetVerificationAssignedToUserId().equals(actor.getId())
                    && "PENDING".equalsIgnoreCase(row.getBudgetVerificationStatus())) {
                return true;
            }
            // payment-assigned employee can submit, continue, or re-submit
            // verification, but not edit it once it has been approved.
            if (canEmployeeAccessPaymentVerification(actor, row)) {
                return true;
            }
            return false;
        }
        return false;
    }

    private boolean canEmployeeAccessPaymentVerification(User actor, Lead row) {
        if (actor == null || row == null || actor.getRole() != Role.EMPLOYEE) {
            return false;
        }
        if (!Objects.equals(row.getPaymentVerificationAssignedToUserId(), actor.getId())) {
            return false;
        }
        return !"APPROVED".equalsIgnoreCase(row.getPaymentVerificationStatus());
    }

    private boolean canDealEmployeeAccessPaymentVerification(User actor, Lead row) {
        if (actor == null || row == null || actor.getRole() != Role.EMPLOYEE) {
            return false;
        }
        if ("APPROVED".equalsIgnoreCase(row.getPaymentVerificationStatus())) {
            return false;
        }
        return dealRepository.findBySourceLeadIdAndDeletedFalse(row.getId())
                .map(deal -> Objects.equals(deal.getOwnerUserId(), actor.getId())
                        || Objects.equals(deal.getDesignAssignedToUserId(), actor.getId())
                        || Objects.equals(deal.getProductionAssignedToUserId(), actor.getId()))
                .orElse(false);
    }

    private boolean canEditRelatedDealPaymentVerification(User actor, Lead row) {
        if (actor == null || row == null) {
            return false;
        }
        if (actor.getRole() == Role.SUPER_ADMIN || actor.getRole() == Role.ADMIN || actor.getRole() == Role.MANAGER) {
            return true;
        }
        if (actor.getRole() != Role.EMPLOYEE) {
            return false;
        }
        if ("APPROVED".equalsIgnoreCase(row.getPaymentVerificationStatus())) {
            return false;
        }
        return dealRepository.findBySourceLeadIdAndDeletedFalse(row.getId())
                .map(deal -> Objects.equals(deal.getOwnerUserId(), actor.getId())
                        || Objects.equals(deal.getDesignAssignedToUserId(), actor.getId())
                        || Objects.equals(deal.getProductionAssignedToUserId(), actor.getId()))
                .orElse(false);
    }

    private boolean isPaymentVerificationUpdateRequest(LeadUpdateDetailsRequest request) {
        if (request == null) {
            return false;
        }
        return request.getPaymentProofFileName() != null
                || request.getPaymentProofFilePath() != null
                || request.getPaymentProofNotes() != null
                || request.getPaymentVerificationStatus() != null
                || request.getPaymentVerificationRejectionReason() != null
                || request.getPaymentVerificationBillingAddressId() != null
                || request.getPaymentVerificationShippingAddressId() != null
                || request.getPaymentVerificationAssignedToUserId() != null
                || request.getPaymentMethod() != null
                || request.getTransactionId() != null
                || request.getPaymentDate() != null
                || request.getPaymentNotes() != null
                || request.getRejectionNotes() != null
                || request.getPaymentVerifiedInvoiceData() != null
                || request.getPaymentVerificationInvoiceFileName() != null
                || request.getPaymentVerificationInvoiceFilePath() != null
                || request.getPaymentVerificationAmount() != null;
    }

    private boolean canEmployeeAllocateTo(User actor, User target, Lead row) {
        if (actor == null || target == null || row == null) {
            return false;
        }
        if (target.getRole() == Role.EMPLOYEE) {
            if (row.getAssignedGroupId() == null) {
                return false;
            }
            return userGroupMemberRepository
                    .findByGroup_IdAndUser_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalse(
                            row.getAssignedGroupId(),
                            target.getId(),
                            Role.EMPLOYEE,
                            ActivationStatus.ACTIVE
                    ).stream()
                    .anyMatch(this::memberHasLeadVisibility);
        }
        if (target.getRole() == Role.MANAGER) {
            return isSameTeamScope(actor, target);
        }
        if (target.getRole() == Role.ADMIN) { 	
            return isSameDepartmentScope(actor, target);
        }
        return false;
    }

    private List<User> loadGroupEmployees(Lead row) {
        if (row == null || row.getAssignedGroupId() == null) {
            return List.of();
        }
        String institutionName = resolveInstitutionNameForDesignation(row.getAssignedGroupId());
        return loadUsersForDesignationGroup(row.getAssignedGroupId(), institutionName)
                .stream()
                .filter(user -> user != null && user.getRole() == Role.EMPLOYEE)
                .toList();
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

    private List<User> loadUsersForDesignationGroup(Long designationId, String institutionName) {
        if (designationId == null) {
            return List.of();
        }
        String normalizedInstitution = StringUtils.hasText(institutionName) ? institutionName.trim() : null;
        return userGroupMemberRepository
                .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                        designationId,
                        Role.EMPLOYEE,
                        ActivationStatus.ACTIVE
                )
                .stream()
                .map(UserGroupMember::getUser)
                .filter(Objects::nonNull)
                .filter(User::isActive)
                .filter(user -> user.getActivationStatus() == ActivationStatus.ACTIVE)
                .filter(user -> matchesInstitution(user, normalizedInstitution))
                .sorted(Comparator.comparing((User user) -> String.valueOf(user.getUsername() == null ? "" : user.getUsername()).toLowerCase(Locale.ROOT))
                        .thenComparing(User::getId))
                .toList();
    }

    private boolean matchesInstitution(User user, String institutionName) {
        if (user == null) {
            return false;
        }
        if (!StringUtils.hasText(institutionName)) {
            return true;
        }
        return StringUtils.hasText(user.getInstitutionName())
                && user.getInstitutionName().trim().equalsIgnoreCase(institutionName);
    }

    private String resolveInstitutionNameForDesignation(Long designationId) {
        if (designationId == null) {
            return null;
        }
        return userGroupRepository.findById(designationId)
                .map(UserGroup::getInstitutionName)
                .orElse(null);
    }

    private Long resolveFlowGroupForStatus(User actor, String status) {
        try {
            List<Map<String, Object>> rules = leadFlowService.getFlowForActor(actor).getRules();
            FlowRule rule = findFlowRule(rules, status);
            return rule == null ? null : rule.handledByGroupId;
        } catch (Exception e) {
            return null;
        }
    }

    private Long resolveFlowGroupForStatusInScope(String institutionName, String status) {
        try {
            List<Map<String, Object>> rules = leadFlowService.getFlowForScope(institutionName).getRules();
            FlowRule rule = findFlowRule(rules, status);
            return rule == null ? null : rule.handledByGroupId;
        } catch (Exception e) {
            return null;
        }
    }

    private Long resolveDealFlowGroupForStatus(String status) {
        try {
            List<Map<String, Object>> rules = dealFlowService.getFlow().getRules();
            FlowRule rule = findFlowRule(rules, status);
            return rule == null ? null : rule.handledByGroupId;
        } catch (Exception e) {
            return null;
        }
    }

    private Long resolvePreferredDealGroupForStatus(User actor, Lead row, String status) {
        Long leadFlowGroupId = resolveFlowGroupForStatus(actor, status);
        if (leadFlowGroupId != null) {
            return leadFlowGroupId;
        }
        return resolveDealFlowGroupForStatus(status);
    }

    private Long resolveFlowNextGroupId(User actor, Lead row, String currentStatus, String nextStatus) {
        try {
            List<Map<String, Object>> rules = getFlowRulesForLeadScope(actor, row);
            FlowRule currentRule = findFlowRule(rules, currentStatus);
            FlowRule targetRule = findFlowRule(rules, nextStatus);
            Long nextGroupId = currentRule != null ? currentRule.nextGroupIdFor(nextStatus) : null;
            // Check target rule before falling back to current rule
            if (nextGroupId == null && targetRule != null) {
                nextGroupId = targetRule.handledByGroupId;
            }
            if (nextGroupId == null && currentRule != null && currentRule.handledByGroupId != null) {
                nextGroupId = currentRule.handledByGroupId;
            }
            return nextGroupId;
        } catch (Exception e) {
            return null;
        }
    }

    private void applyFlowStatusTransition(User actor, Lead row, String nextStatus, Long forcedNextGroupId) {
        if (row == null || !StringUtils.hasText(nextStatus)) {
            return;
        }
        List<Map<String, Object>> rules = getFlowRulesForLeadScope(actor, row);
        if (rules == null || rules.isEmpty()) {
            row.setStatus(nextStatus);
            return;
        }

        String currentStatus = StringUtils.hasText(row.getStatus()) ? row.getStatus().trim() : "";
        FlowRule currentRule = findFlowRule(rules, currentStatus);
        FlowRule targetRule = findFlowRule(rules, nextStatus);

        if (currentRule != null && !currentRule.allows(nextStatus)) {
            throw new IllegalStateException("This status transition is not allowed by flow");
        }

        // Determine current group ID
        Long currentGroupId = row.getAssignedGroupId();
        if (currentGroupId == null && currentRule != null) {
            currentGroupId = currentRule.handledByGroupId;
        }

        // Resolve next group ID from flow rules
        Long nextGroupId = forcedNextGroupId;
        if (nextGroupId == null) {
            nextGroupId = currentRule != null ? currentRule.nextGroupIdFor(nextStatus) : null;
            if (nextGroupId == null && targetRule != null) {
                nextGroupId = targetRule.handledByGroupId;
            }
            if (nextGroupId == null && currentRule != null && currentRule.handledByGroupId != null) {
                nextGroupId = currentRule.handledByGroupId;
            }
        }
        // Force Deal conversion to use the configured Deal group.
        // Prefer the Lead flow's Deal rule because the lead is still transitioning
        // inside the lead pipeline at this point, then fall back to the Deal flow tab.
        if ("deal".equalsIgnoreCase(nextStatus)) {
            Long dealGroupId = resolvePreferredDealGroupForStatus(actor, row, nextStatus);
            if (dealGroupId != null) {
                nextGroupId = dealGroupId;
            }
        }

        // Early funnel statuses should stay with the same employee/group unless a
        // transition explicitly forces a different group. This avoids accidental
        // reassignment and stale flow group references for follow-up stages.
        if (shouldPreserveCurrentAssignment(nextStatus) && forcedNextGroupId == null) {
            nextGroupId = currentGroupId;
        }

        // Treat null nextGroupId as "stay in current group" so status-only transitions
        // (for example into Payment) don't trigger unintended round-robin reassignment.
        boolean groupChanging = nextGroupId != null
                && (currentGroupId == null || !currentGroupId.equals(nextGroupId));

        // When leaving a tracked status, save the current owner for later restoration
        if (shouldTrackOwnerForStatus(currentStatus) && row.getOwnerUserId() != null) {
            setStatusOwner(row, currentStatus, row.getOwnerUserId());
        }

        row.setStatus(nextStatus);

        if (nextGroupId != null) {
            if (userGroupRepository.existsById(nextGroupId)) {
                row.setAssignedGroupId(nextGroupId);
            } else {
                logger.warn("Group ID {} does not exist in user_groups, skipping assignment to prevent foreign key violation", nextGroupId);
            }
        }

        boolean currentOwnerCanStayInTargetGroup = shouldKeepCurrentOwner(row, nextStatus, nextGroupId);

        // Only reassign/restore owner if the group is changing and the current owner
        // is not already a valid member of the target group.
        // Special case: when moving to Deal, assign the next employee from the
        // Deal group in round-robin order, even if the current owner is already
        // a member of that group.
        if ("deal".equalsIgnoreCase(nextStatus)) {
            Long ownerGroupId = nextGroupId != null ? nextGroupId : row.getAssignedGroupId();
            if (ownerGroupId != null) {
                try {
                    User newOwner = resolveDealConversionOwnerForGroup(ownerGroupId);
                    row.setOwnerUserId(newOwner.getId());
                    row.setOwner(resolveOwnerName(newOwner));
                } catch (IllegalStateException ise) {
                    // If no eligible employee is available (e.g. empty group),
                    // keep the current owner rather than blocking the transition.
                    if (ise.getMessage() != null && ise.getMessage().contains("no eligible active employee")) {
                        // current owner is retained — no-op
                    } else {
                        throw new IllegalStateException("Cannot move lead to " + nextStatus + ": " + ise.getMessage());
                    }
                }
            }
        } else if ((groupChanging && !currentOwnerCanStayInTargetGroup)
                && shouldTrackOwnerForStatus(nextStatus)) {
            Long ownerGroupId = nextGroupId != null ? nextGroupId : row.getAssignedGroupId();
            if (ownerGroupId != null) {
                try {
                    applySavedOrRoundRobinOwner(row, nextStatus, ownerGroupId);
                } catch (IllegalStateException ise) {
                    // If no eligible employee is available (e.g. empty group),
                    // keep the current owner rather than blocking the transition.
                    if (ise.getMessage() != null && ise.getMessage().contains("no eligible active employee")) {
                        // current owner is retained — no-op
                    } else {
                        throw new IllegalStateException("Cannot move lead to " + nextStatus + ": " + ise.getMessage());
                    }
                }
            }
        }
    }

    /**
     * Determine if we should save/restore the owner for a given status.
     * Currently tracked: deal, payment, design, production
     */
    private boolean shouldTrackOwnerForStatus(String status) {
        if (!StringUtils.hasText(status)) return false;
        String lower = status.trim().toLowerCase();
        return lower.equals("deal")
                || lower.equals("payment")
                || lower.equals("design")
                || lower.equals("production");
    }

    private boolean shouldPreserveCurrentAssignment(String status) {
        if (!StringUtils.hasText(status)) return false;
        String lower = status.trim().toLowerCase(Locale.ROOT);
        return lower.equals("attempted")
                || lower.equals("interested")
                || lower.equals("requirement");
    }

    private boolean shouldKeepCurrentOwner(Lead row, String nextStatus, Long nextGroupId) {
        if (!shouldTrackOwnerForStatus(nextStatus)) return false;
        if (row == null || row.getOwnerUserId() == null || nextGroupId == null) return false;
        return userGroupMemberRepository
                .findByGroup_IdAndUser_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalse(
                        nextGroupId,
                        row.getOwnerUserId(),
                        Role.EMPLOYEE,
                        ActivationStatus.ACTIVE
                )
                .stream()
                .anyMatch(this::memberHasLeadVisibility);
    }

    /**
     * Set the saved owner for a status (for future restoration).
     */
    private void setStatusOwner(Lead lead, String status, Long userId) {
        if (!StringUtils.hasText(status)) return;
        String lower = status.trim().toLowerCase();
        switch (lower) {
            case "payment":
                lead.setPaymentOwnerId(userId);
                break;
            case "design":
                lead.setDesignOwnerId(userId);
                break;
            case "production":
                lead.setProductionOwnerId(userId);
                break;
        }
    }

    /**
     * Get the saved owner for a status (for restoration).
     */
    private Long getStatusOwner(Lead lead, String status) {
        if (!StringUtils.hasText(status)) return null;
        String lower = status.trim().toLowerCase();
        switch (lower) {
            case "payment":
                return lead.getPaymentOwnerId();
            case "design":
                return lead.getDesignOwnerId();
            case "production":
                return lead.getProductionOwnerId();
            default:
                return null;
        }
    }

    /**
     * Restore saved owner if available and active, otherwise do round-robin and save the new owner.
     */
    private void applySavedOrRoundRobinOwner(Lead lead, String nextStatus, Long ownerGroupId) {
        Long savedOwnerId = getStatusOwner(lead, nextStatus);
        logger.warn("Owner assignment: status={}, groupId={}, savedOwnerId={}", nextStatus, ownerGroupId, savedOwnerId);

        if (savedOwnerId != null) {
            // Try to restore the saved owner if still active
            userRepository.findById(savedOwnerId).ifPresentOrElse(owner -> {
                if (owner.isActive() && owner.getActivationStatus() == ActivationStatus.ACTIVE) {
                    // Saved owner is still active, use them
                    lead.setOwnerUserId(owner.getId());
                    lead.setOwner(resolveOwnerName(owner));
                } else {
                    // Saved owner is inactive, do round-robin instead
                    User newOwner = resolveRoundRobinOwnerForGroup(ownerGroupId);
                    lead.setOwnerUserId(newOwner.getId());
                    lead.setOwner(resolveOwnerName(newOwner));
                    // Update the saved owner for next time
                    setStatusOwner(lead, nextStatus, newOwner.getId());
                }
            }, () -> {
                // Saved owner not found, do round-robin instead
                User newOwner = resolveRoundRobinOwnerForGroup(ownerGroupId);
                lead.setOwnerUserId(newOwner.getId());
                lead.setOwner(resolveOwnerName(newOwner));
                // Update the saved owner for next time
                setStatusOwner(lead, nextStatus, newOwner.getId());
            });
        } else {
            // No saved owner, do round-robin and save it
            User owner = resolveRoundRobinOwnerForGroup(ownerGroupId);
            lead.setOwnerUserId(owner.getId());
            lead.setOwner(resolveOwnerName(owner));
            // Save this owner for future transitions to this status
            setStatusOwner(lead, nextStatus, owner.getId());
        }
    }

    private User resolveRoundRobinOwnerForGroup(Long groupId) {
        if (groupId == null) {
            throw new IllegalStateException("Payment group is required for round robin assignment");
        }
        String scopeInstitution = resolveInstitutionNameForDesignation(groupId);
        List<User> candidates = loadUsersForDesignationGroup(groupId, scopeInstitution);
        if (candidates.isEmpty()) {
            throw new IllegalStateException("Selected group has no eligible active employee available for lead assignment");
        }

        return resolveRoundRobinOwnerFromUsers(groupId, candidates);
    }

    /**
     * Picks the next owner for a lead when it is converted to Deal.
     * This uses the Deal flow group and advances based on the most recent
     * converted deal owner, instead of preserving the current lead owner.
     */
    private User resolveDealConversionOwnerForGroup(Long groupId) {
        if (groupId == null) {
            throw new IllegalStateException("Deal group is required for round robin assignment");
        }

        String scopeInstitution = resolveInstitutionNameForDesignation(groupId);
        List<User> candidates = loadUsersForDesignationGroup(groupId, scopeInstitution);
        if (candidates.isEmpty()) {
            throw new IllegalStateException("Selected group has no eligible active employee available for lead assignment");
        }

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
    }

    private FlowRule findFlowRule(List<Map<String, Object>> rules, String status) {
        if (!StringUtils.hasText(status) || rules == null) {
            return null;
        }
        String key = normalizeStatusAlias(status);
        for (Map<String, Object> raw : rules) {
            if (raw == null) continue;
            Object statusVal = raw.get("status");
            if (statusVal == null) continue;
            if (normalizeStatusAlias(statusVal.toString()).equals(key)) {
                return FlowRule.from(raw);
            }
        }
        return null;
    }

    private void ensureCustomerAccount(Lead lead, User actor) {
        if (lead == null || !StringUtils.hasText(lead.getEmail())) {
            return;
        }
        String email = lead.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmailAndIsDeletedFalse(email).isPresent()) {
            return;
        }
        String fullName = lead.getName() == null ? "" : lead.getName().trim();
        String[] nameParts = fullName.isBlank() ? new String[0] : fullName.split("\\s+", 2);
        String baseUsername = email.contains("@") ? email.substring(0, email.indexOf("@")) : email;
        String username = normalizeCustomerUsername(baseUsername);

        User customer = new User();
        customer.setUsername(username);
        customer.setEmail(email);
        if (nameParts.length > 0) {
            customer.setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
                customer.setLastName(nameParts[1]);
            }
        }
        customer.setPasswordHash(passwordEncoder.encode(DEFAULT_CUSTOMER_PASSWORD));
        customer.setRole(Role.CUSTOMER);
        customer.setActivationStatus(ActivationStatus.ACTIVE);
        customer.setActive(true);
        customer.setForcePasswordChange(true);
        customer.setCreatedBy(actor != null ? actor.getEmail() : null);
        userRepository.save(customer);
        auditService.log("CUSTOMER_CREATED", "Created customer account for lead", email);
    }

    private String normalizeCustomerUsername(String base) {
        String safe = StringUtils.hasText(base) ? base.trim() : "customer";
        safe = safe.replaceAll("[^a-zA-Z0-9._-]", "");
        if (!StringUtils.hasText(safe)) {
            safe = "customer";
        }
        String candidate = safe;
        int counter = 1;
        while (userRepository.existsByUsernameIgnoreCaseAndIsDeletedFalse(candidate)) {
            candidate = safe + counter;
            counter++;
        }
        return candidate;
    }

    /**
     * After updating the flow rules we may need to reassign leads that are
     * already in a status whose handler group has changed.  This method is
     * called by LeadFlowService.updateFlow().
     *
     * For each rule with a non-null handledByGroupId we load all non-deleted
     * leads matching that status, set their assignedGroupId to the new value,
     * attempt a round-robin owner assignment, clear any stale payment-owner
     * marker, and save the lead. If there are no eligible employees in the
     * group, we keep the current owner to avoid violating DB constraints and
     * allow manual reassignment later.
     */
    @Transactional
    public void reassignLeadsForFlow(List<Map<String, Object>> rules) {
        if (rules == null) return;
        for (Map<String, Object> raw : rules) {
            if (raw == null) continue;
            Object statusVal = raw.get("status");
            if (statusVal == null) continue;
            String status = statusVal.toString().trim();
            if (!StringUtils.hasText(status)) continue;
            Long groupId = toLong(raw.get("handledByGroupId"));
            if (groupId == null) continue;

            List<Lead> leads = leadRepository.findByDeletedFalseOrderByCreatedAtDesc()
                    .stream()
                    .filter(l -> status.equalsIgnoreCase(l.getStatus()))
                    .toList();
            for (Lead lead : leads) {
                lead.setAssignedGroupId(groupId);
                try {
                    User owner = resolveRoundRobinOwnerForGroup(groupId);
                    lead.setOwnerUserId(owner.getId());
                    lead.setOwner(resolveOwnerName(owner));
                } catch (IllegalStateException ise) {
                    // no active employee available in target group; keep the
                    // current owner and only move group assignment
                }
                // once we've deliberately moved the lead to a new group the
                // previous payment owner is no longer relevant
                lead.setPaymentOwnerId(null);
                leadRepository.save(lead);
                try {
                    auditService.log("LEAD_FLOW_REASSIGN",
                            "Reassigned lead " + lead.getLeadId() + " to group " + groupId,
                            null);
                } catch (Exception ignore) {
                }
            }
        }
    }

    private static final class FlowRule {
        private final String status;
        private final Long handledByGroupId;
        private final Map<String, Long> nextMap;

        private FlowRule(String status, Long handledByGroupId, Map<String, Long> nextMap) {
            this.status = status;
            this.handledByGroupId = handledByGroupId;
            this.nextMap = nextMap == null ? Map.of() : nextMap;
        }

        static FlowRule from(Map<String, Object> raw) {
            String status = raw.get("status") == null ? "" : raw.get("status").toString();
            Long handledBy = toLong(raw.get("handledByGroupId"));

            Map<String, Long> next = new HashMap<>();
            Object nextObj = raw.get("next");
            if (nextObj instanceof Map<?, ?> nextMapRaw) {
                for (Map.Entry<?, ?> entry : nextMapRaw.entrySet()) {
                    if (entry.getKey() == null) continue;
                    String key = canonicalFlowStatusKey(entry.getKey().toString());
                    next.put(key, toLong(entry.getValue()));
                }
            }
            Object allowedList = raw.get("allowedNext");
            if (allowedList instanceof List<?> allowed) {
                for (Object item : allowed) {
                    if (item == null) continue;
                    String key = canonicalFlowStatusKey(item.toString());
                    next.putIfAbsent(key, null);
                }
            }
            if (next.isEmpty()) {
                Object nextStatuses = raw.get("nextStatuses");
                if (nextStatuses instanceof List<?> list) {
                    for (Object item : list) {
                        if (item == null) continue;
                        next.putIfAbsent(canonicalFlowStatusKey(item.toString()), null);
                    }
                }
            }

            return new FlowRule(canonicalFlowStatusKey(status), handledBy, next);
        }

        boolean allows(String nextStatus) {
            String normalizedNextStatus = canonicalFlowStatusKey(nextStatus);
            if (!StringUtils.hasText(normalizedNextStatus)) {
                return false;
            }
            for (String key : nextMap.keySet()) {
                if (key != null && key.trim().equalsIgnoreCase(normalizedNextStatus)) {
                    return true;
                }
            }
            return false;
        }

        Long nextGroupIdFor(String nextStatus) {
            String normalizedNextStatus = canonicalFlowStatusKey(nextStatus);
            if (!StringUtils.hasText(normalizedNextStatus)) {
                return null;
            }
            for (Map.Entry<String, Long> entry : nextMap.entrySet()) {
                if (entry.getKey() != null && entry.getKey().trim().equalsIgnoreCase(normalizedNextStatus)) {
                    return entry.getValue();
                }
            }
            return null;
        }

        private static String canonicalFlowStatusKey(String value) {
            if (!StringUtils.hasText(value)) {
                return "";
            }
            String key = value.trim().toLowerCase(Locale.ROOT);
            return switch (key) {
                case "new" -> "new lead";
                case "requirement collected", "requirements collected" -> "requirement";
                case "design & production", "design and production" -> "design + production";
                case "stock requested" -> "stock request";
                default -> key;
            };
        }
    }

    private static Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            String text = value.toString().trim();
            if (!StringUtils.hasText(text)) return null;
            return Long.parseLong(text);
        } catch (Exception e) {
            return null;
        }
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

    private boolean isSameDepartmentScope(User actor, UserGroup group) {
        if (actor == null || group == null) {
            return false;
        }
        if (!hasDepartmentScope(actor)) {
            return false;
        }
        return textEquals(actor.getInstitutionName(), group.getInstitutionName())
                && textEquals(actor.getDepartmentName(), group.getDepartmentName());
    }



    private UserGroup resolveLeadGroupForCreate(User actor, Long requestedGroupId) {
        List<UserGroup> availableGroups = findLeadVisibleGroupsForActor(actor);

        if (actor.getRole() == Role.EMPLOYEE) {
            if (availableGroups.isEmpty()) {
                throw new AccessDeniedException("No lead-visible group is assigned to your account");
            }
            if (requestedGroupId == null) {
                return availableGroups.get(0);
            }
            return availableGroups.stream()
                    .filter(group -> Objects.equals(group.getId(), requestedGroupId))
                    .findFirst()
                    .orElseThrow(() -> new AccessDeniedException("You do not have permission to use the selected lead group"));
        }

        if (requestedGroupId == null) {
            throw new IllegalStateException("Lead Group is required");
        }

        return availableGroups.stream()
                .filter(group -> Objects.equals(group.getId(), requestedGroupId))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("You do not have permission to use the selected lead group"));
    }

    private User resolveLeadOwnerForCreate(User actor, UserGroup selectedGroup) {
        if (actor.getRole() == Role.EMPLOYEE) {
            return actor;
        }

        List<UserGroupMember> eligibleMembers = userGroupMemberRepository
                .findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
                        selectedGroup.getId(),
                        Role.EMPLOYEE,
                        ActivationStatus.ACTIVE
                ).stream()
                .filter(this::memberHasLeadVisibility)
                .toList();

        if (eligibleMembers.isEmpty()) {
            throw new IllegalStateException("Selected group has no eligible active employee available for lead assignment");
        }

        return resolveRoundRobinOwner(selectedGroup.getId(), eligibleMembers);
    }

    private boolean isValidManualLeadAssignee(User user) {
        if (user == null || user.isDeleted()) {
            return false;
        }
        if (!user.isActive() || user.getActivationStatus() != ActivationStatus.ACTIVE) {
            return false;
        }
        Role role = user.getRole();
        return role == Role.EMPLOYEE || role == Role.TEAM_LEAD;
    }

    private User resolveRoundRobinOwner(Long groupId, List<UserGroupMember> eligibleMembers) {
        List<User> candidates = eligibleMembers.stream()
                .map(UserGroupMember::getUser)
                .filter(Objects::nonNull)
                .toList();

        if (candidates.isEmpty()) {
            throw new IllegalStateException("Selected group has no eligible active employee available for lead assignment");
        }

        List<Long> candidateIds = candidates.stream().map(User::getId).toList();
        Set<Long> candidateIdSet = new HashSet<>(candidateIds);

        Long lastOwnerUserId = leadRepository.findByDeletedFalseAndAssignedGroupIdOrderByCreatedAtDesc(groupId)
                .stream()
                .map(Lead::getOwnerUserId)
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

        if (currentIndex < 0) {
            return candidates.get(0);
        }

        int nextIndex = (currentIndex + 1) % candidates.size();
        return candidates.get(nextIndex);
    }

    private User resolveRoundRobinOwnerFromUsers(Long groupId, List<User> candidates) {
        if (groupId == null) {
            throw new IllegalStateException("Payment group is required for round robin assignment");
        }
        if (candidates == null || candidates.isEmpty()) {
            throw new IllegalStateException("Selected group has no eligible active employee available for lead assignment");
        }

        List<Long> candidateIds = candidates.stream().map(User::getId).toList();
        Set<Long> candidateIdSet = new HashSet<>(candidateIds);

        Long lastOwnerUserId = leadRepository.findByDeletedFalseAndAssignedGroupIdOrderByCreatedAtDesc(groupId)
                .stream()
                .map(Lead::getOwnerUserId)
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
        if (currentIndex < 0) {
            return candidates.get(0);
        }
        return candidates.get((currentIndex + 1) % candidates.size());
    }

    private void assertActorHasDepartmentScope(User actor) {
        if (!StringUtils.hasText(actor.getInstitutionName())
                || !StringUtils.hasText(actor.getDepartmentName())) {
            throw new AccessDeniedException("Your account is missing department scope configuration");
        }
    }

    private void assertActorHasTeamScope(User actor) {
        assertActorHasDepartmentScope(actor);
        if (!StringUtils.hasText(actor.getTeamName())) {
            throw new AccessDeniedException("Your account is missing team scope configuration");
        }
    }
        /**
     * Assigns payment verification to the next user in round-robin rotation
     * from the group that handles the current lead status via Flow configuration
     */
    private void assignPaymentVerificationRoundRobin(Lead lead) {
        try {
            if (lead == null) {
                return;
            }

            List<Map<String, Object>> rules = getFlowRulesForLeadScope(lead);
            
            if (rules == null || rules.isEmpty()) {
                return; // No flow rules configured, skip assignment
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

            String scopeInstitution = resolveInstitutionNameForDesignation(handledByGroupId);
            List<User> candidates = loadUsersForDesignationGroup(handledByGroupId, scopeInstitution);
            if (candidates.isEmpty()) {
                return;
            }
            
            List<Long> candidateIds = candidates.stream().map(User::getId).toList();
            Set<Long> candidateIdSet = new HashSet<>(candidateIds);
            
            // Find the most recently assigned user in this group
            Long lastAssignedUserId = leadRepository.findByDeletedFalseAndPaymentVerificationAssignedToUserIdIsNotNullOrderByUpdatedAtDesc()
                    .stream()
                    .map(Lead::getPaymentVerificationAssignedToUserId)
                    .filter(Objects::nonNull)
                    .filter(candidateIdSet::contains)
                    .findFirst()
                    .orElse(null);
            
            // Determine next user
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
                
                if (currentIndex < 0) {
                    nextAssignedUser = candidates.get(0);
                } else {
                    int nextIndex = (currentIndex + 1) % candidates.size();
                    nextAssignedUser = candidates.get(nextIndex);
                }
            }
            
            lead.setPaymentVerificationAssignedToUserId(nextAssignedUser.getId());
        } catch (Exception e) {
            // Log and silently fail - don't break payment verification workflow
            logger.warn("Failed to assign payment verification round-robin: " + e.getMessage(), e);
        }
    }

    private void assignBudgetRoundRobin(Lead lead) {
        try {
            if (lead == null) return;
            List<Map<String, Object>> rules = getFlowRulesForLeadScope(lead);
            if (rules == null || rules.isEmpty()) return;

            Long handledByGroupId = null;
            for (Map<String, Object> rule : rules) {
                if (rule == null) continue;
                Object statusVal = rule.get("status");
                if (statusVal != null && statusVal.toString().trim().equalsIgnoreCase("Budget")) {
                    Object groupIdVal = rule.get("handledByGroupId");
                    if (groupIdVal != null) {
                        handledByGroupId = Long.parseLong(groupIdVal.toString());
                        break;
                    }
                }
            }
            if (handledByGroupId == null) return;

            String scopeInstitution = resolveInstitutionNameForDesignation(handledByGroupId);
            List<User> candidates = loadUsersForDesignationGroup(handledByGroupId, scopeInstitution);
            if (candidates.isEmpty()) return;
            List<Long> candidateIds = candidates.stream().map(User::getId).toList();
            Set<Long> candidateIdSet = new HashSet<>(candidateIds);

            Long lastAssignedUserId = leadRepository
                    .findByDeletedFalseAndBudgetVerificationAssignedToUserIdIsNotNullOrderByUpdatedAtDesc()
                    .stream()
                    .map(Lead::getBudgetVerificationAssignedToUserId)
                    .filter(Objects::nonNull)
                    .filter(candidateIdSet::contains)
                    .findFirst().orElse(null);

            User nextAssignedUser;
            if (lastAssignedUserId == null) {
                nextAssignedUser = candidates.get(0);
            } else {
                int currentIndex = -1;
                for (int idx = 0; idx < candidates.size(); idx++) {
                    if (Objects.equals(candidates.get(idx).getId(), lastAssignedUserId)) {
                        currentIndex = idx; break;
                    }
                }
                int nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % candidates.size();
                nextAssignedUser = candidates.get(nextIndex);
            }
            lead.setBudgetVerificationAssignedToUserId(nextAssignedUser.getId());
        } catch (Exception e) {
            logger.warn("Failed to assign budget round-robin: " + e.getMessage(), e);
        }
    }

    private List<Map<String, Object>> getFlowRulesForLeadScope(User actor, Lead lead) {
        try {
            if (lead != null && lead.getAssignedGroupId() != null) {
                return Optional.ofNullable(resolveInstitutionNameForDesignation(lead.getAssignedGroupId()))
                        .map(scope -> leadFlowService.getFlowForScope(scope).getRules())
                        .orElseGet(() -> leadFlowService.getFlowForActor(actor).getRules());
            }
            return leadFlowService.getFlowForActor(actor).getRules();
        } catch (Exception e) {
            return leadFlowService.getFlow().getRules();
        }
    }

    private List<Map<String, Object>> getFlowRulesForLeadScope(Lead lead) {
        try {
            if (lead == null || lead.getAssignedGroupId() == null) {
                return leadFlowService.getFlow().getRules();
            }
            return Optional.ofNullable(resolveInstitutionNameForDesignation(lead.getAssignedGroupId()))
                    .map(scope -> leadFlowService.getFlowForScope(scope).getRules())
                    .orElseGet(() -> leadFlowService.getFlow().getRules());
        } catch (Exception e) {
            return leadFlowService.getFlow().getRules();
        }
    }

    private boolean hasLeadVisibility(UserGroup group) {
        return hasAnyPageAccess(group == null ? null : group.getPageKeysCsv(), Set.of(LEADS_PAGE_KEY));
    }

    private boolean memberHasLeadVisibility(UserGroupMember membership) {
        return hasAnyPageAccess(membership == null ? null : membership.getPageKeysCsv(), Set.of(LEADS_PAGE_KEY));
    }

    private boolean hasLeadRecordVisibility(UserGroup group) {
        return hasAnyPageAccess(group == null ? null : group.getPageKeysCsv(), LEAD_RECORD_PAGE_KEYS);
    }

    private boolean memberHasLeadRecordVisibility(UserGroupMember membership) {
        return hasAnyPageAccess(membership == null ? null : membership.getPageKeysCsv(), LEAD_RECORD_PAGE_KEYS);
    }

    private boolean hasAnyPageAccess(String pageKeysCsv, Set<String> allowedPageKeys) {
        if (!StringUtils.hasText(pageKeysCsv)) {
            return true;
        }
        return parseCsv(pageKeysCsv).stream()
                .anyMatch(value -> allowedPageKeys.stream().anyMatch(key -> key.equalsIgnoreCase(value)));
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

    private LeadResponse toResponse(Lead row,
                                    Map<Long, String> groupNameMap,
                                    Map<Long, String> userNameMap) {
        LeadResponse res = new LeadResponse();
        res.setId(row.getId());
        res.setLeadId(row.getLeadId());
        res.setEuid(row.getEuid());
        res.setName(row.getName());
        res.setEmail(row.getEmail());
        res.setMobile(row.getMobile());
        res.setCountryCode(row.getCountryCode());
        res.setAlternatePhone(row.getAlternatePhone());
        res.setAlternateEmail(row.getAlternateEmail());
        res.setPrimarySource(row.getPrimarySource());
        res.setSecondarySource(row.getSecondarySource());
        res.setProjectName(row.getProjectName());
        res.setOccupation(row.getOccupation());
        res.setCompanyName(row.getCompanyName());
        res.setProductType(row.getProductType());
        res.setVariant(row.getVariant());
        res.setQuantity(row.getQuantity());
        res.setLeadCountry(row.getLeadCountry());
        res.setLeadState(row.getLeadState());
        res.setLeadCity(row.getLeadCity());
        res.setLeadPincode(row.getLeadPincode());
        res.setStreetAddress(row.getStreetAddress());
        res.setProjectId(row.getProjectId());
        res.setLeadType(row.getLeadType());
        res.setStatus(getEffectiveLeadStatus(row));
        res.setSvStatus(row.getSvStatus());
        res.setLeadGroupId(row.getAssignedGroupId());
        res.setLeadGroupName(groupNameMap.get(row.getAssignedGroupId()));
        res.setAllocatorUserId(row.getAllocatorUserId());
        res.setAllocator(userNameMap.get(row.getAllocatorUserId()));
        res.setOwnerUserId(row.getOwnerUserId());

        String ownerName = row.getOwner();
        if (!StringUtils.hasText(ownerName) && row.getOwnerUserId() != null) {
            ownerName = userNameMap.get(row.getOwnerUserId());
        }
        res.setOwner(ownerName);

        res.setFollowUpDate(row.getFollowUpDate());
        res.setAttemptedOpenReason(row.getAttemptedOpenReason());
        res.setAttemptedCallStatus(row.getAttemptedCallStatus());
        res.setAttemptedCallRemarks(row.getAttemptedCallRemarks());
        res.setNotAttemptedCallStatus(row.getNotAttemptedCallStatus());
        res.setNotAttemptedCallRemarks(row.getNotAttemptedCallRemarks());
        res.setInterestedFollowUpDate(row.getInterestedFollowUpDate());
        res.setInterestedCallStatus(row.getInterestedCallStatus());
        res.setInterestedCallRemarks(row.getInterestedCallRemarks());
        res.setRejectedReason(row.getRejectedReason());
        res.setRejectedReasonSubtype(row.getRejectedReasonSubtype());
        // payment tracking
        res.setTotalAmount(row.getTotalAmount());
        res.setPaidAmount(row.getPaidAmount());
        res.setRemainingAmount(row.getRemainingAmount());
        res.setDesignStartAt(row.getDesignStartAt());
        res.setDesignEndAt(row.getDesignEndAt());
        // if the lead is currently in design phase but a payment employee still
        // owns it this field carries the original owner so the frontend can
        // restore them when the status flips back to payment.
        res.setPaymentOwnerId(row.getPaymentOwnerId());
        res.setProductionOwnerId(row.getProductionOwnerId());
        res.setPreDealOwnerUserId(row.getPreDealOwnerUserId());
        // requirement values
        res.setRequirementType(row.getRequirementType());
        res.setRequirementFileName(row.getRequirementFileName());
        res.setRequirementFilePath(row.getRequirementFilePath());
        res.setRequirementFileType(row.getRequirementFileType());
        res.setRequirementFileSize(row.getRequirementFileSize());
        res.setRequirementNotes(row.getRequirementNotes());
        // payment verification values
        res.setPaymentProofFileName(row.getPaymentProofFileName());
        res.setPaymentProofFilePath(row.getPaymentProofFilePath());
        res.setPaymentProofNotes(row.getPaymentProofNotes());
        res.setPaymentVerificationStatus(row.getPaymentVerificationStatus());
        res.setPaymentVerificationRejectionReason(row.getPaymentVerificationRejectionReason());
        // payment verification address IDs
        res.setPaymentVerificationBillingAddressId(row.getPaymentVerificationBillingAddressId());
        res.setPaymentVerificationShippingAddressId(row.getPaymentVerificationShippingAddressId());
        res.setPaymentVerificationAssignedToUserId(row.getPaymentVerificationAssignedToUserId());
        res.setPaymentVerificationAssignedToUserName(userNameMap.get(row.getPaymentVerificationAssignedToUserId()));
        res.setPaymentVerificationAmount(row.getPaymentVerificationAmount());
        res.setBudgetInvoiceSent(row.isBudgetInvoiceSent());
        res.setPaymentInvoiceSent(row.isPaymentInvoiceSent());
        res.setCreatedAt(row.getCreatedAt());
        res.setUpdatedAt(row.getUpdatedAt());
        res.setGstin(row.getGstin());
        // payment details & invoice
        res.setPaymentNotes(row.getPaymentNotes());
        res.setRejectionNotes(row.getRejectionNotes());
        res.setInvoiceData(row.getInvoiceData());
        res.setPaymentVerifiedInvoiceData(row.getPaymentVerifiedInvoiceData());
        res.setInvoiceCgstPercent(row.getInvoiceCgstPercent());
        res.setInvoiceSgstPercent(row.getInvoiceSgstPercent());
        // budget verification
        res.setBudgetVerificationStatus(row.getBudgetVerificationStatus());
        res.setBudgetVerificationAssignedToUserId(row.getBudgetVerificationAssignedToUserId());
        res.setBudgetVerificationAssignedToUserName(userNameMap.get(row.getBudgetVerificationAssignedToUserId()));
        res.setBudgetVerificationRejectionReason(row.getBudgetVerificationRejectionReason());
        // duplicate detection
        res.setDuplicate(row.isDuplicate());
        res.setDuplicateOfLeadId(row.getDuplicateOfLeadId());
        res.setDuplicateOfLeadRef(row.getDuplicateOfLeadRef());
        res.setDuplicateOfLeadName(row.getDuplicateOfLeadName());
        return res;
    }

    @Transactional(readOnly = true)
    public List<LeadLogResponse> listLeadLogs(Long leadId, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        Lead lead = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        if (!canViewLead(actor, lead, visibleGroupIds)) {
            throw new AccessDeniedException("You do not have permission to access this lead");
        }
        return leadLogRepository.findByLeadIdOrderByCreatedAtDesc(leadId).stream()
                .map(this::toLeadLogResponse)
                .toList();
    }

    private void createLeadLog(Long leadId, String action, User actor) {
        createLeadLog(leadId, action, actor, null, null);
    }

    private Map<String, Object> storeLeadFile(Long leadId,
                                              MultipartFile file,
                                              String folderName,
                                              String storedPrefix) throws java.io.IOException {
        String originalName = StringUtils.hasText(file.getOriginalFilename())
                ? Paths.get(file.getOriginalFilename()).getFileName().toString()
                : storedPrefix;

        String extension = "";
        int dot = originalName.lastIndexOf('.');
        if (dot > -1 && dot < originalName.length() - 1) {
            extension = originalName.substring(dot);
        }

        Path fileDir = Path.of(uploadDir, folderName, String.valueOf(leadId)).toAbsolutePath().normalize();
        Files.createDirectories(fileDir);

        String storedName = storedPrefix + "-" + UUID.randomUUID() + extension;
        Path target = fileDir.resolve(storedName).normalize();
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String relativePath = Path.of("uploads", folderName, String.valueOf(leadId), storedName)
                .toString()
                .replace('\\', '/');

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("fileName", originalName);
        out.put("filePath", relativePath);
        out.put("fileType", StringUtils.hasText(file.getContentType()) ? file.getContentType() : "application/octet-stream");
        out.put("fileSize", file.getSize());
        return out;
    }

    private void createLeadLog(Long leadId, String action, User actor, String fileName, String filePath) {
        if (leadId == null || !StringUtils.hasText(action) || actor == null) {
            return;
        }
        LeadLog log = new LeadLog();
        log.setLeadId(leadId);
        log.setAction(action.trim());
        String actorName = StringUtils.hasText(actor.getUsername())
                ? actor.getUsername()
                : actor.getEmail();
        log.setActor(actorName);
        log.setFileName(StringUtils.hasText(fileName) ? fileName.trim() : null);
        log.setFilePath(StringUtils.hasText(filePath) ? filePath.trim() : null);
        leadLogRepository.save(log);
    }

    private LeadLogResponse toLeadLogResponse(LeadLog log) {
        LeadLogResponse res = new LeadLogResponse();
        res.setId(log.getId());
        res.setAction(log.getAction());
        res.setActor(log.getActor());
        res.setFileName(log.getFileName());
        res.setFilePath(log.getFilePath());
        res.setCreatedAt(log.getCreatedAt());
        return res;
    }

    private String resolveOwnerName(User user) {
        if (user == null) {
            return "Unassigned";
        }
        if (StringUtils.hasText(user.getUsername())) {
            return user.getUsername().trim();
        }
        if (StringUtils.hasText(user.getEmail())) {
            return user.getEmail().trim();
        }
        String firstName = StringUtils.hasText(user.getFirstName()) ? user.getFirstName().trim() : "";
        String lastName = StringUtils.hasText(user.getLastName()) ? user.getLastName().trim() : "";
        String fullName = (firstName + " " + lastName).trim();
        if (StringUtils.hasText(fullName)) {
            return fullName;
        }
        return "User-" + user.getId();
    }

    private Map<Long, String> loadGroupNameMap(List<Lead> leads) {
        Map<Long, String> out = new HashMap<>();
        List<Long> ids = leads.stream()
                .map(Lead::getAssignedGroupId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return out;
        }
        userGroupRepository.findAllById(ids)
                .stream()
                .filter(Objects::nonNull)
                .forEach(group -> out.put(group.getId(), group.getName()));
        return out;
    }

    private Map<Long, String> loadUserNameMap(List<Lead> leads) {
        Map<Long, String> out = new HashMap<>();
        Set<Long> ids = new HashSet<>();
        for (Lead lead : leads) {
            if (lead.getAllocatorUserId() != null) {
                ids.add(lead.getAllocatorUserId());
            }
            if (lead.getOwnerUserId() != null) {
                ids.add(lead.getOwnerUserId());
            }
            if (lead.getPaymentVerificationAssignedToUserId() != null) {
                ids.add(lead.getPaymentVerificationAssignedToUserId());
            }
        }
        if (ids.isEmpty()) {
            return out;
        }

        userRepository.findAllById(ids).forEach(user -> {
            if (!user.isDeleted()) {
                String displayName = StringUtils.hasText(user.getUsername())
                        ? user.getUsername()
                        : (StringUtils.hasText(user.getEmail()) ? user.getEmail() : resolveOwnerName(user));
                out.put(user.getId(), displayName);
            }
        });
        return out;
    }

    private boolean canAssignAllocator(User actor, User candidate) {
        boolean self = actor.getId().equals(candidate.getId());
        boolean strictlyBelow = RolePermissionUtil.isStrictlyHigher(actor.getRole(), candidate.getRole());
        if (!self && !strictlyBelow) {
            return false;
        }
        return canManageWithinOrgScope(actor, candidate);
    }

    private boolean canManageWithinOrgScope(User actor, User target) {
        if (actor.getId().equals(target.getId())) {
            return true;
        }
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.ADMIN) {
            if (!hasDepartmentScope(target)) {
                return true;
            }
            return textEquals(actor.getInstitutionName(), target.getInstitutionName())
                    && textEquals(actor.getDepartmentName(), target.getDepartmentName());
        }
        if (actor.getRole() == Role.MANAGER) {
            if (!hasTeamScope(target)) {
                return true;
            }
            return textEquals(actor.getInstitutionName(), target.getInstitutionName())
                    && textEquals(actor.getDepartmentName(), target.getDepartmentName())
                    && textEquals(actor.getTeamName(), target.getTeamName());
        }
        return false;
    }

    private boolean textEquals(String a, String b) {
        return normalizeNullable(a) != null && normalizeNullable(a).equalsIgnoreCase(StringUtils.hasText(b) ? b.trim() : "");
    }

    private boolean hasDepartmentScope(User user) {
        return StringUtils.hasText(user.getInstitutionName())
                && StringUtils.hasText(user.getDepartmentName());
    }

    private boolean hasTeamScope(User user) {
        return hasDepartmentScope(user) && StringUtils.hasText(user.getTeamName());
    }

    private LeadAllocatorOptionResponse toAllocatorOptionResponse(User user) {
        LeadAllocatorOptionResponse res = new LeadAllocatorOptionResponse();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setRole(user.getRole() == null ? null : user.getRole().name());
        return res;
    }

    private LeadAssignableGroupResponse toAssignableGroupResponse(UserGroup group) {
        LeadAssignableGroupResponse response = new LeadAssignableGroupResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setInstitutionName(group.getInstitutionName());
        response.setDepartmentName(group.getDepartmentName());
        response.setTeamNames(parseCsv(group.getTeamNamesCsv()));
        response.setPageKeys(parseCsv(group.getPageKeysCsv()));
        return response;
    }

    private boolean containsIgnoreCase(String value, String query) {
        if (!StringUtils.hasText(query)) return true;
        return StringUtils.hasText(value) && value.toLowerCase(Locale.ROOT).contains(query.trim().toLowerCase(Locale.ROOT));
    }

    private boolean equalsIgnoreCase(String value, String expected) {
        if (!StringUtils.hasText(expected)) return true;
        return StringUtils.hasText(value) && value.equalsIgnoreCase(expected.trim());
    }

    private boolean matchesLeadStatus(String value, String expected) {
        if (!StringUtils.hasText(expected)) return true;
        return StringUtils.hasText(value)
                && normalizeStatusAlias(value).equals(normalizeStatusAlias(expected));
    }

    private boolean matchQuickDate(LocalDateTime createdAt, String quickDate) {
        if (!StringUtils.hasText(quickDate)) return true;
        if (createdAt == null) return false;
        LocalDate today = LocalDate.now();
        LocalDate date = createdAt.toLocalDate();
        String key = quickDate.trim().toLowerCase(Locale.ROOT);
        if ("today".equals(key)) {
            return date.equals(today);
        }
        if ("weekly".equals(key)) {
            return !date.isBefore(today.minusDays(7));
        }
        if ("monthly".equals(key)) {
            return !date.isBefore(today.minusDays(30));
        }
        return true;
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) return null;
        return value.trim();
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) return null;
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void validateSecondarySourceForPrimary(String primarySource, String secondarySource) {
        if (!StringUtils.hasText(secondarySource)) {
            return;
        }
        if (!StringUtils.hasText(primarySource)) {
            throw new IllegalStateException("Primary source is required when secondary source is selected");
        }

        PrimarySource primary = primarySourceRepository
                .findBySourceNameIgnoreCaseAndDeletedFalse(primarySource.trim())
                .orElseThrow(() -> new IllegalStateException("Invalid primary source"));
        SecondarySource secondary = secondarySourceRepository
                .findBySourceNameIgnoreCaseAndDeletedFalse(secondarySource.trim())
                .orElseThrow(() -> new IllegalStateException("Invalid secondary source"));

        if (secondary.getPrimarySourceId() == null) {
            return;
        }
        if (!Objects.equals(secondary.getPrimarySourceId(), primary.getId())) {
            throw new IllegalStateException("Secondary source does not belong to the selected primary source");
        }
    }

    @Transactional(readOnly = true)
    public List<CheckDuplicatesContactResponse> checkDuplicates(CheckDuplicatesRequest request, String actorPrincipal) {
        assertLeadAccess(actorPrincipal);
        if (request.getContacts() == null || request.getContacts().isEmpty()) return List.of();
        List<CheckDuplicatesContactResponse> results = new java.util.ArrayList<>();
        for (CheckDuplicatesRequest.ContactItem contact : request.getContacts()) {
            String mobileNorm = normalizeMobile(contact.getMobile());
            String emailNorm = normalizeEmail(contact.getEmail());
            Lead match = null;
            if (StringUtils.hasText(mobileNorm)) {
                match = leadRepository
                        .findFirstByDeletedFalseAndIsDuplicateFalseAndMobileNormalizedOrderByCreatedAtDesc(mobileNorm)
                        .orElse(null);
            }
            if (match == null && StringUtils.hasText(emailNorm)) {
                match = leadRepository
                        .findFirstByDeletedFalseAndIsDuplicateFalseAndEmailNormalizedOrderByCreatedAtDesc(emailNorm)
                        .orElse(null);
            }
            if (match != null) {
                CheckDuplicatesContactResponse res = new CheckDuplicatesContactResponse();
                res.setMobile(contact.getMobile());
                res.setEmail(contact.getEmail());
                res.setMatchedLeadId(match.getId());
                res.setMatchedLeadRef(match.getLeadId());
                res.setMatchedLeadName(match.getName());
                results.add(res);
            }
        }
        return results;
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> getDuplicateLeads(String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Set<Long> visibleGroupIds = resolveVisibleLeadGroupIds(actor);
        List<Lead> rows = leadRepository.findByDeletedFalseAndIsDuplicateTrueOrderByCreatedAtDesc().stream()
                .filter(row -> canViewLead(actor, row, visibleGroupIds))
                .toList();
        Map<Long, String> groupNameMap = loadGroupNameMap(rows);
        Map<Long, String> userNameMap = loadUserNameMap(rows);
        return rows.stream().map(row -> toResponse(row, groupNameMap, userNameMap)).toList();
    }

    public ConvertDuplicateResponse convertDuplicate(Long leadId, ConvertDuplicateRequest request, String actorPrincipal) {
        User actor = assertLeadAccess(actorPrincipal);
        Lead row = leadRepository.findByIdAndDeletedFalse(leadId)
                .orElseThrow(() -> new EntityNotFoundException("Lead not found"));
        if (!row.isDuplicate()) {
            throw new IllegalStateException("Lead is not marked as duplicate");
        }
        if (!request.isForce()) {
            String mobileNorm = row.getMobileNormalized();
            String emailNorm = row.getEmailNormalized();
            Lead match = null;
            if (StringUtils.hasText(mobileNorm)) {
                match = leadRepository
                        .findFirstByDeletedFalseAndIsDuplicateFalseAndMobileNormalizedAndIdNotOrderByCreatedAtDesc(mobileNorm, leadId)
                        .orElse(null);
            }
            if (match == null && StringUtils.hasText(emailNorm)) {
                match = leadRepository
                        .findFirstByDeletedFalseAndIsDuplicateFalseAndEmailNormalizedAndIdNotOrderByCreatedAtDesc(emailNorm, leadId)
                        .orElse(null);
            }
            if (match != null) {
                ConvertDuplicateResponse res = new ConvertDuplicateResponse();
                res.setStillDuplicate(true);
                res.setMatchedLeadRef(match.getLeadId());
                res.setMatchedLeadName(match.getName());
                return res;
            }
        }
        row.setDuplicate(false);
        row.setDuplicateOfLeadId(null);
        row.setDuplicateOfLeadRef(null);
        row.setDuplicateOfLeadName(null);
        row.setStatus("New Lead");
        leadRepository.save(row);
        auditService.log("LEAD_CONVERT_DUPLICATE", "Converted duplicate lead " + row.getLeadId() + " to new lead", actor.getEmail());
        ConvertDuplicateResponse res = new ConvertDuplicateResponse();
        res.setConverted(true);
        res.setLeadId(leadId);
        return res;
    }

    private String normalizeMobile(String mobile) {
        if (!StringUtils.hasText(mobile)) return null;
        return mobile.replaceAll("[^0-9]", "");
    }

    private List<String> distinctSorted(List<String> values) {
        return values.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .sorted(Comparator.comparing(String::toLowerCase))
                .toList();
    }

    private String normalizeKey(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : "";
    }

    private String normalizeStatusAlias(String value) {
        String key = normalizeKey(value);
        return switch (key) {
            case "new" -> "new lead";
            case "requirement collected", "requirements collected" -> "requirement";
            case "design & production", "design and production" -> "design + production";
            case "stock requested" -> "stock request";
            default -> key;
        };
    }

    private String getEffectiveLeadStatus(Lead row) {
        if (shouldPromoteLeadToRequirementStatus(row)) {
            return "Requirement";
        }
        return row == null ? null : row.getStatus();
    }

    private void promoteLeadToRequirementStatusIfNeeded(Lead row) {
        if (shouldPromoteLeadToRequirementStatus(row)) {
            row.setStatus("Requirement");
        }
    }

    private boolean shouldPromoteLeadToRequirementStatus(Lead row) {
        if (row == null || row.getId() == null) {
            return false;
        }
        String status = normalizeStatusAlias(row.getStatus());
        if (!status.equals("new lead")
                && !status.equals("not attempted")
                && !status.equals("attempted")
                && !status.equals("interested")) {
            return false;
        }
        return requirementRepository.existsByLeadId(row.getId());
    }

    private boolean isHigherOfficial(Role role) {
        return role == Role.SUPER_ADMIN || role == Role.ADMIN || role == Role.MANAGER || role == Role.TEAM_LEAD;
    }

    private void sendLeadAssignmentEmails(Lead lead, User employee, User actor) {
        if (lead == null || employee == null || actor == null) {
            return;
        }

        if (employee.getId().equals(actor.getId())) {
            // Self-assignment: look up reporting officials
            java.util.List<User> candidates = userRepository.findByRoleInAndActivationStatusAndIsDeletedFalseOrderByUsernameAsc(
                java.util.List.of(Role.MANAGER, Role.TEAM_LEAD, Role.ADMIN, Role.SUPER_ADMIN),
                ActivationStatus.ACTIVE
            ).stream()
            .filter(User::isActive)
            .toList();

            java.util.List<User> reportingPersons = candidates.stream()
                .filter(u -> !u.getId().equals(employee.getId()))
                .filter(u -> isSameTeamScope(employee, u) || isSameDepartmentScope(employee, u))
                .toList();

            if (reportingPersons.isEmpty()) {
                // Fallback to global Admins and Super Admins
                reportingPersons = candidates.stream()
                    .filter(u -> !u.getId().equals(employee.getId()))
                    .filter(u -> u.getRole() == Role.ADMIN || u.getRole() == Role.SUPER_ADMIN)
                    .toList();
            }

            for (User official : reportingPersons) {
                if (StringUtils.hasText(official.getEmail())) {
                    emailTemplateRepository.findByTemplateKey(EmailTemplateKey.LEAD_CREATED_SELF_TEMPLATE.getKey()).ifPresent(template -> {
                        if (!template.isActive()) {
                            return;
                        }
                        java.util.Map<String, String> tokens = new java.util.HashMap<>();
                        tokens.put("Reporting Person Name", official.getUsername());
                        tokens.put("Employee Name", employee.getUsername());
                        tokens.put("Lead ID", lead.getLeadId() == null ? "" : lead.getLeadId());
                        tokens.put("Customer Name", lead.getName() == null ? "" : lead.getName());
                        tokens.put("Company Name", lead.getCompanyName() == null ? "" : lead.getCompanyName());
                        tokens.put("Phone Number", lead.getMobile() == null ? "" : lead.getMobile());
                        tokens.put("Customer Email", lead.getEmail() == null ? "" : lead.getEmail());
                        
                        String reqType = lead.getRequirementType() == null ? "" : lead.getRequirementType();
                        String reqNotes = lead.getRequirementNotes() == null ? "" : lead.getRequirementNotes();
                        String req = reqType;
                        if (org.springframework.util.StringUtils.hasText(reqNotes)) {
                            req = org.springframework.util.StringUtils.hasText(req) ? req + " (" + reqNotes + ")" : reqNotes;
                        }
                        tokens.put("Requirement", req);
                        tokens.put("Priority", "NORMAL");
                        
                        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
                        tokens.put("Created Date", lead.getCreatedAt() == null ? java.time.LocalDateTime.now().format(dtf) : lead.getCreatedAt().format(dtf));

                        String subject = renderTemplate(template.getSubject(), tokens);
                        String body = renderTemplate(template.getBody(), tokens);
                        emailNotificationService.notifyNowIfEnabled(official.getEmail(), subject, body);
                    });
                }
            }
            return; // Exit early so standard creator/recipient flow is skipped
        }

        // Send email to Employee
        if (StringUtils.hasText(employee.getEmail())) {
            emailTemplateRepository.findByTemplateKey(EmailTemplateKey.LEAD_ASSIGNED_EMPLOYEE_TEMPLATE.getKey()).ifPresent(template -> {
                if (!template.isActive()) {
                    return;
                }
                java.util.Map<String, String> tokens = new java.util.HashMap<>();
                tokens.put("employee_name", employee.getUsername());
                tokens.put("lead_id", lead.getLeadId() == null ? "" : lead.getLeadId());
                tokens.put("lead_name", lead.getName() == null ? "" : lead.getName());
                tokens.put("actor_name", actor.getUsername());

                tokens.put("Employee Name", employee.getUsername());
                tokens.put("Lead Name", lead.getName() == null ? "" : lead.getName());
                tokens.put("Lead ID", lead.getLeadId() == null ? "" : lead.getLeadId());
                tokens.put("Customer Name", lead.getName() == null ? "" : lead.getName());
                tokens.put("Company Name", lead.getCompanyName() == null ? "" : lead.getCompanyName());
                tokens.put("Phone", lead.getMobile() == null ? "" : lead.getMobile());
                tokens.put("Customer Email", lead.getEmail() == null ? "" : lead.getEmail());
                
                String reqType = lead.getRequirementType() == null ? "" : lead.getRequirementType();
                String reqNotes = lead.getRequirementNotes() == null ? "" : lead.getRequirementNotes();
                String req = reqType;
                if (org.springframework.util.StringUtils.hasText(reqNotes)) {
                    req = org.springframework.util.StringUtils.hasText(req) ? req + " (" + reqNotes + ")" : reqNotes;
                }
                tokens.put("Requirement", req);
                tokens.put("Assigned By", actor.getUsername());
                
                java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
                tokens.put("Assigned Date", java.time.LocalDateTime.now().format(dtf));
                String subject = renderTemplate(template.getSubject(), tokens);
                String body = renderTemplate(template.getBody(), tokens);
                emailNotificationService.notifyNowIfEnabled(employee.getEmail(), subject, body);
            });
        }

        // Send email to Lead
        if (StringUtils.hasText(lead.getEmail())) {
            emailTemplateRepository.findByTemplateKey(EmailTemplateKey.LEAD_ASSIGNED_CUSTOMER_TEMPLATE.getKey()).ifPresent(template -> {
                if (!template.isActive()) {
                    return;
                }
                Map<String, String> tokens = Map.of(
                    "lead_name", lead.getName() == null ? "" : lead.getName(),
                    "employee_name", employee.getUsername()
                );
                String subject = renderTemplate(template.getSubject(), tokens);
                String body = renderTemplate(template.getBody(), tokens);
                emailNotificationService.notifyNowIfEnabled(lead.getEmail(), subject, body);
            });
        }
    }

    private void syncDealForLeadStatusSafely(Lead lead, User actor) {
        try {
            if (lead == null) {
                return;
            }
            if ("deal".equalsIgnoreCase(lead.getStatus())) {
                dealService.createOrUpdateFromLead(lead, actor == null ? null : actor.getId());
            } else {
                dealService.deleteBySourceLeadId(lead.getId());
            }
        } catch (Exception ex) {
            logger.error("Lead status was saved but deal sync failed for lead {}: {}",
                    lead == null ? null : lead.getId(),
                    ex.getMessage(),
                    ex);
        }
    }

    private void sendLeadStatusUpdateEmailSafely(Lead lead) {
        try {
            sendLeadStatusUpdateEmail(lead);
        } catch (Exception ex) {
            logger.warn("Lead status was saved but notification failed for lead {}: {}",
                    lead == null ? null : lead.getId(),
                    ex.getMessage());
        }
    }

    private void sendLeadStatusUpdateEmail(Lead lead) {
        if (lead == null || lead.getAllocatorUserId() == null) {
            return;
        }
        userRepository.findByIdAndIsDeletedFalse(lead.getAllocatorUserId()).ifPresent(allocator -> {
            if (StringUtils.hasText(allocator.getEmail())) {
                emailTemplateRepository.findByTemplateKey(EmailTemplateKey.LEAD_STATUS_UPDATED_TEMPLATE.getKey()).ifPresent(template -> {
                    if (!template.isActive()) {
                        return;
                    }
                    String allocatorName = StringUtils.hasText(allocator.getUsername())
                            ? allocator.getUsername()
                            : (StringUtils.hasText(allocator.getEmail()) ? allocator.getEmail() : "Team");
                    Map<String, String> tokens = Map.of(
                        "official_name", allocatorName,
                        "lead_id", lead.getLeadId() == null ? "" : lead.getLeadId(),
                        "lead_name", lead.getName() == null ? "" : lead.getName(),
                        "status", lead.getStatus() == null ? "" : lead.getStatus()
                    );
                    String subject = renderTemplate(template.getSubject(), tokens);
                    String body = renderTemplate(template.getBody(), tokens);
                    emailNotificationService.notifyNowIfEnabled(allocator.getEmail(), subject, body);
                });
            }
        });
    }

    private String renderTemplate(String template, Map<String, String> tokens) {
        if (template == null) return "";
        String result = template;
        for (Map.Entry<String, String> entry : tokens.entrySet()) {
            String val = entry.getValue() == null ? "" : entry.getValue();
            result = result.replace("{{" + entry.getKey() + "}}", val);
        }
        return result;
    }
}
