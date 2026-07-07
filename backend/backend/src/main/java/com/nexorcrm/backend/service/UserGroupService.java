package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.CreateUserGroupRequest;
import com.nexorcrm.backend.dto.UpdateUserGroupRequest;
import com.nexorcrm.backend.dto.UpdateUserGroupMemberPagesRequest;
import com.nexorcrm.backend.dto.UserGroupAssignableTeamResponse;
import com.nexorcrm.backend.dto.UserGroupAssignableUserResponse;
import com.nexorcrm.backend.dto.UserGroupMemberResponse;
import com.nexorcrm.backend.dto.UserGroupResponse;
import com.nexorcrm.backend.dto.UserGroupSummaryResponse;
import com.nexorcrm.backend.entity.ActivationStatus;
import com.nexorcrm.backend.entity.BranchMaster;
import com.nexorcrm.backend.entity.HeadOfficeMaster;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.entity.UserGroup;
import com.nexorcrm.backend.entity.UserGroupMember;
import com.nexorcrm.backend.entity.UserGroupMemberScope;
import com.nexorcrm.backend.entity.UserDepartment;
import com.nexorcrm.backend.entity.UserDesignation;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.HeadOfficeMasterRepository;
import com.nexorcrm.backend.repo.UserDepartmentRepository;
import com.nexorcrm.backend.repo.UserDesignationRepository;
import com.nexorcrm.backend.repo.UserGroupMemberRepository;
import com.nexorcrm.backend.repo.UserGroupRepository;
import com.nexorcrm.backend.repo.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.nexorcrm.backend.security.RolePermissionUtil;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserGroupService {
    private record GroupScope(String institutionName,
                              String departmentName) {}
    private record ResolvedGroupScope(
            Long headOfficeId,
            Long branchId,
            Long departmentId,
            List<Long> departmentIds,
            String institutionName,
            String departmentName,
            List<String> departmentNames,
            List<String> teamNames
    ) {}

    public static final List<String> DEFAULT_PAGE_KEYS = List.of(
            // Dashboard
            "dashboard",
            "admin-dashboard",
            "employee-dashboard",
            "sales-dashboard",
            // CRM
            "leads",
            "design",
            "production",
            "delivery",
            "contacts",
            "companies",
            "pipeline",
            "analytics",
            "activity",
            "quotation",
            "lead-source",
            "lead-status",
            "primary-source",
            "secondary-source",
            "requirements",
            "budget-verifications",
            "payment-verifications",
            "invoices",
            // Operations
            "stocks",
            "stocks-dashboard",
            "stocks-item",
            "stocks-categories",
            "projects",
            "projects-list",
            "project-status",
            "project-type",
            "tasks",
            "task-board",
            // Recruitment
            "recruitment",
            "recruitment-jobs",
            "recruitment-candidates",
            "recruitment-referrals",
            // HRM
            "employees",
            "employees-list",
            "organization",
            "head-offices",
            "branches",
            "departments",
            "designations",
            "policy",
            "email-settings",
            "email-template",
            "tickets",
            "holidays",
            "attendance",
            "leaves",
            "leaves-employee",
            "leave-settings",
            "attendance-admin",
            "attendance-employee",
            "timesheets",
            "schedule-timing",
            "shift-assignments",
            "overtime",
            "performance",
            "performance-indicator",
            "performance-appraisal",
            "goal-tracking",
            "goal-type",
            "training",
            "training-list",
            "trainers",
            "training-type",
            "promotion",
            "resignation",
            "termination",
            // Finance
            "sales",
            "estimates",
            "sales-invoices",
            "payments",
            "expenses",
            "provident-fund",
            "taxes",
            "accounting",
            "categories",
            "budgets",
            "budget-expenses",
            "budget-revenues",
            "payroll",
            "employee-salary",
            "payslip",
            "payroll-items",
            "accounts",
            "payment-verifications-page",
            "budget-verifications-page",
            "stock-requests",
            "vendor-management",
            "vendors",
            "vendor-orders",
            "brands",
            "vendor-types",
            // Reports
            "reports",
            "expenses-report",
            "invoice-report",
            "payment-report",
            "employee-report",
            "task-report",
            "user-report",
            "daily-report",
            "leave-report",
            "project-report",
            // Settings
            "settings",
            "settings-useradmin",
            "settings-page-access",
            "settings-group-access",
            "settings-usergroups",
            "settings-department-permissions",
            "settings-designation-permissions",
            "settings-user-departments",
            "settings-user-designations",
            "settings-registration",
            "settings-session",
            "settings-user",
            "settings-security",
            "settings-security-settings",
            "settings-flow",
            "settings-logs",
            // Services
            "services",
            "service-categories",
            "service-types",
            "price-list",
            "product-field-config",
            // Clients
            "clients",
            // Legacy keys
            "site-visits",
            "followup-leads",
            "import-leads",
            "opportunity",
            "customer",
            "report",
            // Compatibility aliases
            "shift-assignment",
            "payslip-template",
            "settings-workflow-teams"
    );
    private static final Set<String> ALLOWED_PAGE_KEYS = Set.copyOf(DEFAULT_PAGE_KEYS);

    private final UserGroupRepository userGroupRepository;
    private final UserGroupMemberRepository userGroupMemberRepository;
    private final UserRepository userRepository;
    private final HeadOfficeMasterRepository headOfficeMasterRepository;
    private final BranchMasterRepository branchMasterRepository;
    private final UserDepartmentRepository userDepartmentRepository;
    private final UserDesignationRepository userDesignationRepository;
    private final AuditService auditService;

    public UserGroupService(UserGroupRepository userGroupRepository,
                            UserGroupMemberRepository userGroupMemberRepository,
                            UserRepository userRepository,
                            HeadOfficeMasterRepository headOfficeMasterRepository,
                            BranchMasterRepository branchMasterRepository,
                            UserDepartmentRepository userDepartmentRepository,
                            UserDesignationRepository userDesignationRepository,
                            AuditService auditService) {
        this.userGroupRepository = userGroupRepository;
        this.userGroupMemberRepository = userGroupMemberRepository;
        this.userRepository = userRepository;
        this.headOfficeMasterRepository = headOfficeMasterRepository;
        this.branchMasterRepository = branchMasterRepository;
        this.userDepartmentRepository = userDepartmentRepository;
        this.userDesignationRepository = userDesignationRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<UserGroupResponse> listGroups(String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanManageGroups(actor);

        if (actor.getRole() == Role.SUPER_ADMIN) {
            return userGroupRepository.findAllByOrderByNameAsc()
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (actor.getRole() == Role.ADMIN) {
            assertActorHasBranchScope(actor);
        } else {
            assertActorHasDepartmentScope(actor);
        }
        List<UserGroup> rows = userGroupRepository
                .findByInstitutionNameIgnoreCaseOrderByNameAsc(actor.getInstitutionName())
                .stream()
                .filter(group -> isGroupVisibleToActor(actor, group))
                .toList();

        if (actor.getRole() == Role.MANAGER) {
            String actorTeamLower = normalizeLower(actor.getTeamName());
            rows = rows.stream()
                    .filter(group -> parseTeamNames(group).stream()
                            .map(this::normalizeLower)
                            .anyMatch(actorTeamLower::equals))
                    .toList();
        }
        return rows.stream().map(this::toResponse).toList();
    }

    public UserGroupResponse createGroup(CreateUserGroupRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanCreateOrEditGroups(actor);

        String name = request.getName().trim();

        UserGroupMemberScope memberScope = resolveMemberScope(request.getMemberScope());
        ResolvedGroupScope targetScope = resolveScopeForCreate(actor, request, memberScope);
        if (userGroupRepository.existsByNameIgnoreCaseAndInstitutionNameIgnoreCase(name, targetScope.institutionName())) {
            throw new IllegalStateException("Group name already exists");
        }
        List<String> scopedTeams = resolveScopedTeamsForActor(
                actor,
                targetScope.teamNames(),
                requiresTeamSelection(memberScope),
                new GroupScope(targetScope.institutionName(), targetScope.departmentName())
        );

        UserGroup group = new UserGroup();
        group.setName(name);
        group.setSystemGroup(false);
        group.setMemberScope(memberScope);
        group.setInstitutionName(targetScope.institutionName());
        group.setDepartmentName(targetScope.departmentName());
        group.setTeamNamesCsv(String.join(",", scopedTeams));
        group.setPageKeysCsv(String.join(",", resolveGroupPageKeysForActor(actor, request.getPageKeys(), null)));

        UserGroup saved = userGroupRepository.save(group);
        auditService.log("GROUP_CREATE", "Created user group", actor.getEmail());
        return toResponse(saved);
    }

    public UserGroupResponse updateGroup(Long id, UpdateUserGroupRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanCreateOrEditGroups(actor);

        UserGroup group = userGroupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User group not found"));
        assertCanAccessGroup(actor, group);

        String name = request.getName().trim();

        List<String> oldGroupPageKeys = parseTeamNamesCsv(group.getPageKeysCsv());
        List<String> resolvedGroupPageKeys = resolveGroupPageKeysForActor(actor, request.getPageKeys(), group);
        UserGroupMemberScope memberScope = resolveMemberScope(request.getMemberScope());
        ResolvedGroupScope targetScope = resolveScopeForUpdate(actor, request, memberScope, group);
        if (userGroupRepository.existsByNameIgnoreCaseAndInstitutionNameIgnoreCaseAndIdNot(name, targetScope.institutionName(), id)) {
            throw new IllegalStateException("Group name already exists");
        }
        List<String> scopedTeams = resolveScopedTeamsForActor(
                actor,
                targetScope.teamNames(),
                requiresTeamSelection(memberScope),
                new GroupScope(targetScope.institutionName(), targetScope.departmentName())
        );

        group.setName(name);
        group.setMemberScope(memberScope);
        group.setInstitutionName(targetScope.institutionName());
        group.setDepartmentName(targetScope.departmentName());
        group.setTeamNamesCsv(String.join(",", scopedTeams));
        group.setPageKeysCsv(String.join(",", resolvedGroupPageKeys));

        UserGroup saved = userGroupRepository.save(group);
        applyGroupPageVisibilityToMembers(saved, oldGroupPageKeys, resolvedGroupPageKeys);
        auditService.log("GROUP_UPDATE", "Updated user group", actor.getEmail());
        return toResponse(saved);
    }

    public void deleteGroup(Long id, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanCreateOrEditGroups(actor);

        UserGroup group = userGroupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User group not found"));
        assertCanAccessGroup(actor, group);
        if (group.isSystemGroup()) {
            throw new AccessDeniedException("System groups cannot be deleted");
        }
        userGroupRepository.delete(group);
        auditService.log("GROUP_DELETE", "Deleted user group", actor.getEmail());
    }

    @Transactional(readOnly = true)
    public List<UserGroupAssignableTeamResponse> listAssignableTeams(String actorPrincipal,
                                                                     String institutionName,
                                                                     String departmentName) {
        User actor = resolveActor(actorPrincipal);
        assertCanManageGroups(actor);
        List<String> teams;
        if (actor.getRole() == Role.SUPER_ADMIN
                && StringUtils.hasText(institutionName)
                && StringUtils.hasText(departmentName)) {
            teams = getAvailableTeamsForScope(new GroupScope(
                    institutionName.trim(),
                    departmentName.trim()
            ));
        } else {
            teams = getAvailableTeamsForActor(actor);
        }
        return teams.stream().map(team -> {
            UserGroupAssignableTeamResponse response = new UserGroupAssignableTeamResponse();
            response.setTeamName(team);
            return response;
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<String> listMyVisiblePageKeys(String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(actor.getId());
        List<UserGroup> implicitSystemGroups = resolveImplicitSystemGroupsForActor(actor);
        if (memberships.isEmpty() && implicitSystemGroups.isEmpty()) {
            // No group override: keep default menu behavior.
            return DEFAULT_PAGE_KEYS;
        }
        Set<String> resolvedSet = new LinkedHashSet<>();

        memberships.stream()
                .flatMap(member -> {
                    List<String> memberKeys = parseTeamNamesCsv(member.getPageKeysCsv());
                    if (!memberKeys.isEmpty()) {
                        return memberKeys.stream();
                    }
                    UserGroup group = member.getGroup();
                    return parseTeamNamesCsv(group == null ? null : group.getPageKeysCsv()).stream();
                })
                .filter(ALLOWED_PAGE_KEYS::contains)
                .forEach(resolvedSet::add);

        implicitSystemGroups.stream()
                .flatMap(group -> parseTeamNamesCsv(group.getPageKeysCsv()).stream())
                .filter(ALLOWED_PAGE_KEYS::contains)
                .forEach(resolvedSet::add);

        List<String> resolved = resolvedSet.stream().sorted().toList();

        // Safety fallback: avoid locking users out on refresh due legacy/blank member page keys.
        return resolved.isEmpty() ? DEFAULT_PAGE_KEYS : resolved;
    }

    private List<UserGroup> resolveImplicitSystemGroupsForActor(User actor) {
        List<UserGroup> allGroups = userGroupRepository.findAllByOrderByNameAsc();
        return allGroups.stream()
                .filter(UserGroup::isSystemGroup)
                .filter(group -> appliesSystemGroupToActor(group, actor))
                .toList();
    }

    private boolean appliesSystemGroupToActor(UserGroup group, User actor) {
        UserGroupMemberScope scope = group.getMemberScope() == null ? UserGroupMemberScope.NONE : group.getMemberScope();
        if (scope == UserGroupMemberScope.ADMINS) {
            if (!(actor.getRole() == Role.ADMIN || actor.getRole() == Role.SUPER_ADMIN)) {
                return false;
            }
        } else if (scope == UserGroupMemberScope.MANAGERS) {
            if (actor.getRole() != Role.MANAGER) {
                return false;
            }
        } else if (scope == UserGroupMemberScope.TEAM_LEADS) {
            if (actor.getRole() != Role.TEAM_LEAD) {
                return false;
            }
        } else if (scope == UserGroupMemberScope.EMPLOYEES) {
            if (actor.getRole() != Role.EMPLOYEE) {
                return false;
            }
        } else {
            return false;
        }

        if (StringUtils.hasText(group.getInstitutionName())
                && !textEquals(group.getInstitutionName(), actor.getInstitutionName())) {
            return false;
        }
        if (!parseDepartmentNamesCsv(group.getDepartmentName()).isEmpty()
                && !matchesAnyName(parseDepartmentNamesCsv(group.getDepartmentName()), actor.getDepartmentName())) {
            return false;
        }
        return true;
    }

    @Transactional(readOnly = true)
    public List<UserGroupAssignableUserResponse> listAssignableUsers(
            String actorPrincipal,
            Long groupId,
            List<String> teamNames,
            String paramInstitutionName,
            List<String> paramDepartmentNames,
            String paramMemberScope
    ) {
        User actor = resolveActor(actorPrincipal);
        assertCanManageGroups(actor);

        List<User> candidates;
        List<String> scopedTeams;
        UserGroup group = null;
        if (groupId != null) {
            group = userGroupRepository.findById(groupId)
                    .orElseThrow(() -> new EntityNotFoundException("User group not found"));
            assertCanAccessGroup(actor, group);
        }

        // Determine memberScope
        UserGroupMemberScope memberScope = UserGroupMemberScope.NONE;
        if (StringUtils.hasText(paramMemberScope)) {
            try {
                memberScope = UserGroupMemberScope.valueOf(paramMemberScope.toUpperCase());
            } catch (IllegalArgumentException e) {
                // ignore, keep NONE
            }
        } else if (group != null) {
            memberScope = group.getMemberScope() == null ? UserGroupMemberScope.NONE : group.getMemberScope();
        }

        List<Role> allowedRoles = allowedRolesForMemberScope(memberScope);
        if (memberScope == UserGroupMemberScope.NONE && actor.getRole() == Role.SUPER_ADMIN) {
            allowedRoles = List.of(Role.ADMIN, Role.MANAGER, Role.TEAM_LEAD, Role.EMPLOYEE);
        }

        // Determine institutionName
        String institutionName = null;
        if (StringUtils.hasText(paramInstitutionName)) {
            institutionName = paramInstitutionName;
        } else if (group != null) {
            institutionName = group.getInstitutionName();
        }

        // Determine scopedTeams
        if (teamNames != null) {
            scopedTeams = teamNames;
        } else if (group != null) {
            scopedTeams = parseTeamNames(group);
        } else {
            scopedTeams = List.of();
        }

        // Determine departmentNames
        List<String> groupDepartments;
        if (paramDepartmentNames != null) {
            groupDepartments = paramDepartmentNames;
        } else if (group != null) {
            groupDepartments = parseDepartmentNamesCsv(group.getDepartmentName());
        } else {
            groupDepartments = List.of();
        }

        if (actor.getRole() == Role.SUPER_ADMIN) {
            if (!StringUtils.hasText(institutionName)) {
                return List.of();
            }
            List<String> normalizedTeamNames = scopedTeams.stream()
                    .map(this::normalizeLower)
                    .toList();
            if (memberScope == UserGroupMemberScope.ADMINS || groupDepartments.isEmpty()) {
                candidates = userRepository.findActiveByRoleInAndBranchScope(
                        allowedRoles,
                        ActivationStatus.ACTIVE,
                        institutionName
                );
            } else if (memberScope == UserGroupMemberScope.MANAGERS || normalizedTeamNames.isEmpty()) {
                candidates = List.of();
                for (String departmentName : groupDepartments) {
                    candidates = mergeUsers(candidates, userRepository.findActiveByRoleInAndDepartmentScope(
                            allowedRoles,
                            ActivationStatus.ACTIVE,
                            institutionName,
                            departmentName
                    ));
                }
            } else {
                candidates = List.of();
                for (String departmentName : groupDepartments) {
                    candidates = mergeUsers(candidates, userRepository.findActiveByRoleInAndDepartmentScopeAndTeamNameIn(
                            allowedRoles,
                            ActivationStatus.ACTIVE,
                            institutionName,
                            departmentName,
                            normalizedTeamNames
                    ));
                }
            }
            return candidates.stream()
                    .map(this::toAssignableUserResponse)
                    .toList();
        }

        if (actor.getRole() == Role.ADMIN) {
            if (memberScope == UserGroupMemberScope.ADMINS || groupDepartments.isEmpty()) {
                candidates = userRepository.findActiveByRoleInAndBranchScope(
                        allowedRoles,
                        ActivationStatus.ACTIVE,
                        actor.getInstitutionName()
                );
            } else if (memberScope == UserGroupMemberScope.MANAGERS) {
                candidates = List.of();
                for (String departmentName : groupDepartments) {
                    candidates = mergeUsers(candidates, userRepository.findActiveByRoleInAndDepartmentScope(
                            allowedRoles,
                            ActivationStatus.ACTIVE,
                            actor.getInstitutionName(),
                            departmentName
                    ));
                }
            } else {
                if (scopedTeams.isEmpty()) {
                    return List.of();
                }
                candidates = List.of();
                List<String> normalizedTeams = scopedTeams.stream().map(this::normalizeLower).toList();
                for (String departmentName : groupDepartments) {
                    candidates = mergeUsers(candidates, userRepository.findActiveByRoleInAndDepartmentScopeAndTeamNameIn(
                            allowedRoles,
                            ActivationStatus.ACTIVE,
                            actor.getInstitutionName(),
                            departmentName,
                            normalizedTeams
                    ));
                }
            }
            return candidates.stream()
                    .map(this::toAssignableUserResponse)
                    .toList();
        }

        if (scopedTeams.isEmpty()) {
            return List.of();
        }

        List<String> normalizedTeamNames = scopedTeams.stream()
                .map(this::normalizeLower)
                .toList();

        candidates = userRepository.findActiveByRoleInAndDepartmentScopeAndTeamNameIn(
                allowedRoles,
                ActivationStatus.ACTIVE,
                actor.getInstitutionName(),
                actor.getDepartmentName(),
                normalizedTeamNames
        );
        return candidates.stream()
                .map(this::toAssignableUserResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserGroupSummaryResponse> listGroupsForUser(Long userId, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        User target = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        assertCanManageGroups(actor);
        assertCanViewUser(actor, target);

        List<UserGroupMember> memberships = userGroupMemberRepository.findByUser_IdOrderByIdAsc(userId);
        if (memberships.isEmpty()) {
            return List.of();
        }

        List<UserGroupSummaryResponse> rows = new ArrayList<>();
        for (UserGroupMember member : memberships) {
            UserGroup group = member.getGroup();
            assertCanAccessGroup(actor, group);
            rows.add(toSummaryResponse(group));
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public List<UserGroupMemberResponse> listGroupMembers(Long id, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanManageGroups(actor);
        UserGroup group = userGroupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User group not found"));
        assertCanAccessGroup(actor, group);

        return userGroupMemberRepository.findByGroupOrderByUserUsernameAsc(group)
                .stream()
                .map(this::toMemberResponse)
                .toList();
    }

    public List<UserGroupMemberResponse> addGroupMember(Long id, Long userId, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanManageGroups(actor);
        UserGroup group = userGroupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User group not found"));
        assertCanAccessGroup(actor, group);

        if (group.isSystemGroup()
                && actor.getRole() != Role.SUPER_ADMIN
                && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Cannot manually edit members of system groups");
        }
        User target = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if (!target.isActive() && target.getActivationStatus() != ActivationStatus.ACTIVE) {
            throw new IllegalStateException("Only active users can be added");
        }
        boolean canSuperAdminAssignAdmin = actor.getRole() == Role.SUPER_ADMIN && target.getRole() == Role.ADMIN;
        UserGroupMemberScope scope = group.getMemberScope() == null ? UserGroupMemberScope.NONE : group.getMemberScope();
        if (!canAddRoleToGroup(scope, target.getRole(), canSuperAdminAssignAdmin)) {
            throw new AccessDeniedException("User role is not allowed for this group");
        }
        boolean isManagerAddingManagerToAdminsGroup = actor.getRole() == Role.MANAGER
                && target.getRole() == Role.MANAGER
                && scope == UserGroupMemberScope.ADMINS;
        if (!isManagerAddingManagerToAdminsGroup) {
            assertUserInsideActorScope(actor, target);
        } else {
            assertUserInsideGroupDepartmentScope(group, target);
        }
        if (actor.getRole() == Role.ADMIN) {
            appendTeamToGroupIfMissing(group, target.getTeamName());
        } else if (actor.getRole() == Role.SUPER_ADMIN && target.getRole() == Role.ADMIN) {
            assertUserInsideGroupDepartmentScope(group, target);
        } else if (target.getRole() == Role.MANAGER || target.getRole() == Role.ADMIN) {
            // SUPER_ADMIN, ADMIN, MANAGER can add managers/admins from different teams in the same department
            assertUserInsideGroupDepartmentScope(group, target);
        } else {
            if (actor.getRole() == Role.SUPER_ADMIN) {
                assertUserInsideGroupDepartmentScope(group, target);
            }
            assertUserInsideGroupTeams(group, target);
        }

        if (!userGroupMemberRepository.existsByGroupAndUserId(group, userId)) {
            UserGroupMember member = new UserGroupMember();
            member.setGroup(group);
            member.setUser(target);
            member.setPageKeysCsv(group.getPageKeysCsv());
            userGroupMemberRepository.save(member);
            auditService.log("GROUP_MEMBER_ADD", "Added user to group", target.getEmail());
        }
        return listGroupMembers(id, actorPrincipal);
    }

    public List<UserGroupMemberResponse> removeGroupMember(Long id, Long userId, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanManageGroups(actor);
        UserGroup group = userGroupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User group not found"));
        assertCanAccessGroup(actor, group);

        if (group.isSystemGroup()
                && actor.getRole() != Role.SUPER_ADMIN
                && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Cannot manually edit members of system groups");
        }
        userGroupMemberRepository.deleteByGroupAndUserId(group, userId);
        auditService.log("GROUP_MEMBER_REMOVE", "Removed user from group", actor.getEmail());
        return listGroupMembers(id, actorPrincipal);
    }

    public List<UserGroupMemberResponse> updateMemberPageVisibility(Long id,
                                                                    Long userId,
                                                                    UpdateUserGroupMemberPagesRequest request,
                                                                    String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        assertCanManageGroups(actor);
        assertCanEditPageVisibility(actor);
        UserGroup group = userGroupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User group not found"));
        assertCanAccessGroup(actor, group);

        UserGroupMember member = userGroupMemberRepository.findByGroupAndUserId(group, userId)
                .orElseThrow(() -> new EntityNotFoundException("Group member not found"));
        List<String> pageKeys = sanitizeMemberPageKeysForGroup(group, request == null ? null : request.getPageKeys());
        member.setPageKeysCsv(String.join(",", pageKeys));
        userGroupMemberRepository.save(member);
        auditService.log("GROUP_MEMBER_PAGES_UPDATE", "Updated group member page visibility", actor.getEmail());
        return listGroupMembers(id, actorPrincipal);
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

    private void assertCanManageGroups(User actor) {
        if (actor.getRole() != Role.SUPER_ADMIN && actor.getRole() != Role.ADMIN && actor.getRole() != Role.MANAGER) {
            throw new AccessDeniedException("You do not have permission to manage user groups");
        }
    }

    private void assertCanCreateOrEditGroups(User actor) {
        if (actor.getRole() != Role.SUPER_ADMIN) {
            throw new AccessDeniedException("Only super admins can create, edit, or delete groups");
        }
    }

    private boolean canEditPageVisibility(User actor) {
        return actor.getRole() == Role.SUPER_ADMIN || actor.getRole() == Role.ADMIN;
    }

    private void assertCanEditPageVisibility(User actor) {
        if (!canEditPageVisibility(actor)) {
            throw new AccessDeniedException("Only admins can edit page visibility");
        }
    }

    private void assertCanAccessGroup(User actor, UserGroup group) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (actor.getRole() == Role.ADMIN) {
            assertActorHasBranchScope(actor);
        } else {
            assertActorHasDepartmentScope(actor);
        }
        if (!isGroupVisibleToActor(actor, group)) {
            throw new AccessDeniedException("You do not have permission to access this group");
        }
        if (group.getMemberScope() == UserGroupMemberScope.ADMINS) {
            return;
        }
        if (actor.getRole() == Role.TEAM_LEAD) {
            String actorTeamLower = normalizeLower(actor.getTeamName());
            boolean canSee = parseTeamNames(group).stream()
                    .map(this::normalizeLower)
                    .anyMatch(actorTeamLower::equals);
            if (!canSee) {
                throw new AccessDeniedException("You do not have permission to access this group");
            }
        }
    }

    private boolean isGroupVisibleToActor(User actor, UserGroup group) {
        if (!textEquals(actor.getInstitutionName(), group.getInstitutionName())) {
            return false;
        }
        if (group.getMemberScope() == UserGroupMemberScope.ADMINS) {
            return actor.getRole() == Role.ADMIN || actor.getRole() == Role.SUPER_ADMIN;
        }
        if (actor.getRole() == Role.ADMIN) {
            return true;
        }
        return parseDepartmentNamesCsv(group.getDepartmentName()).isEmpty()
                || matchesAnyName(parseDepartmentNamesCsv(group.getDepartmentName()), actor.getDepartmentName());
    }

    private void assertActorHasBranchScope(User actor) {
        if (!StringUtils.hasText(actor.getInstitutionName())) {
            throw new AccessDeniedException("Your account is missing branch scope configuration");
        }
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

    private List<String> resolveScopedTeamsForActor(User actor,
                                                    List<String> requestedTeamNames,
                                                    boolean requireAtLeastOne,
                                                    GroupScope targetScope) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            List<String> sanitizedRequested = sanitizeTeamNames(requestedTeamNames);
            if (targetScope == null) {
                if (requireAtLeastOne && sanitizedRequested.isEmpty()) {
                    throw new IllegalStateException("At least one team must be selected");
                }
                return sanitizedRequested;
            }
            List<String> availableTeams = getAvailableTeamsForScope(targetScope);
            Map<String, String> availableByLower = availableTeams.stream()
                    .collect(Collectors.toMap(this::normalizeLower, team -> team, (a, b) -> a, LinkedHashMap::new));
            Set<String> dedup = new LinkedHashSet<>();
            for (String team : sanitizedRequested) {
                String canonical = availableByLower.get(normalizeLower(team));
                if (canonical != null) {
                    dedup.add(canonical);
                }
            }
            if (dedup.isEmpty() && requireAtLeastOne) {
                throw new IllegalStateException("At least one team must be selected");
            }
            return new ArrayList<>(dedup);
        }

        assertActorHasDepartmentScope(actor);
        List<String> availableTeams = getAvailableTeamsForActor(actor);
        Map<String, String> availableByLower = availableTeams.stream()
                .collect(Collectors.toMap(this::normalizeLower, team -> team, (a, b) -> a, LinkedHashMap::new));

        if (actor.getRole() == Role.MANAGER || actor.getRole() == Role.TEAM_LEAD) {
            assertActorHasTeamScope(actor);
            return List.of(actor.getTeamName().trim());
        }

        List<String> sanitizedRequested = sanitizeTeamNames(requestedTeamNames);
        if (requireAtLeastOne && sanitizedRequested.isEmpty()) {
            throw new IllegalStateException("At least one team must be selected");
        }
        Set<String> dedup = new LinkedHashSet<>();
        for (String team : sanitizedRequested) {
            String lower = normalizeLower(team);
            String canonical = availableByLower.get(lower);
            if (canonical == null) {
                throw new AccessDeniedException("Selected team is outside your department scope: " + team);
            }
            dedup.add(canonical);
        }
        return new ArrayList<>(dedup);
    }

    private List<String> getAvailableTeamsForScope(GroupScope scope) {
        return userRepository.findDistinctTeamNamesByDepartmentScope(
                scope.institutionName(),
                scope.departmentName()
        ).stream().filter(StringUtils::hasText).map(String::trim).distinct().toList();
    }

    private List<String> getAvailableTeamsForActor(User actor) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return userRepository.findDistinctTeamNames().stream()
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .distinct()
                    .toList();
        }
        if (actor.getRole() == Role.MANAGER || actor.getRole() == Role.TEAM_LEAD) {
            assertActorHasTeamScope(actor);
            return List.of(actor.getTeamName().trim());
        }
        assertActorHasDepartmentScope(actor);
        return userRepository.findDistinctTeamNamesByDepartmentScope(
                actor.getInstitutionName(),
                actor.getDepartmentName()
        ).stream().filter(StringUtils::hasText).map(String::trim).distinct().toList();
    }

    private void assertUserInsideActorScope(User actor, User target) {
        if (target.getRole() == Role.SUPER_ADMIN) {
            throw new AccessDeniedException("You do not have permission to assign this user");
        }
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (target.getRole() == Role.ADMIN) {
            throw new AccessDeniedException("You do not have permission to assign this user");
        }
        if (!textEquals(actor.getInstitutionName(), target.getInstitutionName())
                || !textEquals(actor.getDepartmentName(), target.getDepartmentName())) {
            throw new AccessDeniedException("You do not have permission to assign this user");
        }
        if ((actor.getRole() == Role.MANAGER || actor.getRole() == Role.TEAM_LEAD)
                && !textEquals(actor.getTeamName(), target.getTeamName())) {
            throw new AccessDeniedException("You do not have permission to assign this user");
        }
    }

    private void assertUserInsideGroupTeams(UserGroup group, User target) {
        String targetTeamLower = normalizeLower(target.getTeamName());
        boolean match = parseTeamNames(group).stream()
                .map(this::normalizeLower)
                .anyMatch(targetTeamLower::equals);
        if (!match) {
            throw new AccessDeniedException("Selected user is not in this group's teams");
        }
    }

    private void assertUserInsideGroupDepartmentScope(UserGroup group, User target) {
        if (!StringUtils.hasText(group.getInstitutionName())
                || !StringUtils.hasText(group.getDepartmentName())) {
            // Legacy group rows may not have scope columns populated.
            return;
        }
        if (!textEquals(group.getInstitutionName(), target.getInstitutionName())
                || (!parseDepartmentNamesCsv(group.getDepartmentName()).isEmpty()
                && !matchesAnyName(parseDepartmentNamesCsv(group.getDepartmentName()), target.getDepartmentName()))) {
            throw new AccessDeniedException("Selected user is outside this group's scope");
        }
    }

    private boolean matchesAnyName(List<String> names, String value) {
        return names.stream().anyMatch(name -> textEquals(name, value));
    }

    private void assertCanViewUser(User actor, User target) {
        boolean canEdit = RolePermissionUtil.canEdit(
                actor.getRole(),
                actor.getId(),
                target.getRole(),
                target.getId()
        );
        if (!canEdit) {
            throw new AccessDeniedException("You do not have permission to view this user");
        }
        if (!canManageWithinOrgScope(actor, target)) {
            throw new AccessDeniedException("You do not have permission to view this user");
        }
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
        if (actor.getRole() == Role.TEAM_LEAD) {
            if (!hasTeamScope(target)) {
                return true;
            }
            return textEquals(actor.getInstitutionName(), target.getInstitutionName())
                    && textEquals(actor.getDepartmentName(), target.getDepartmentName())
                    && textEquals(actor.getTeamName(), target.getTeamName());
        }
        return false;
    }

    private boolean hasDepartmentScope(User user) {
        return StringUtils.hasText(user.getInstitutionName())
                && StringUtils.hasText(user.getDepartmentName());
    }

    private boolean hasTeamScope(User user) {
        return hasDepartmentScope(user) && StringUtils.hasText(user.getTeamName());
    }

    private List<String> parseTeamNames(UserGroup group) {
        return parseTeamNamesCsv(group.getTeamNamesCsv());
    }

    private void appendTeamToGroupIfMissing(UserGroup group, String teamName) {
        if (!StringUtils.hasText(teamName)) return;
        String targetTeam = teamName.trim();
        List<String> teams = new ArrayList<>(parseTeamNames(group));
        boolean exists = teams.stream()
                .map(this::normalizeLower)
                .anyMatch(normalizeLower(targetTeam)::equals);
        if (exists) return;
        teams.add(targetTeam);
        group.setTeamNamesCsv(String.join(",", teams));
        userGroupRepository.save(group);
    }

    private List<String> parseTeamNamesCsv(String csv) {
        if (!StringUtils.hasText(csv)) return List.of();
        return java.util.Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private List<String> parseDepartmentNamesCsv(String csv) {
        if (!StringUtils.hasText(csv)) return List.of();
        return java.util.Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private List<User> mergeUsers(List<User> left, List<User> right) {
        Map<Long, User> merged = new LinkedHashMap<>();
        if (left != null) {
            for (User user : left) {
                merged.put(user.getId(), user);
            }
        }
        if (right != null) {
            for (User user : right) {
                merged.put(user.getId(), user);
            }
        }
        return new ArrayList<>(merged.values());
    }

    private long countUsersByDepartmentsAndTeams(List<Role> roles,
                                                 String institutionName,
                                                 List<String> departments,
                                                 List<String> teams) {
        if (departments == null || departments.isEmpty() || teams == null || teams.isEmpty()) {
            return 0;
        }
        long total = 0;
        for (String departmentName : departments) {
            total += userRepository.findActiveByRoleInAndDepartmentScopeAndTeamNameIn(
                    roles,
                    ActivationStatus.ACTIVE,
                    institutionName,
                    departmentName,
                    teams
            ).size();
        }
        return total;
    }

    private List<String> sanitizeTeamNames(List<String> teamNames) {
        if (teamNames == null || teamNames.isEmpty()) return List.of();
        return teamNames.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private List<String> sanitizePageKeys(List<String> pageKeys) {
        if (pageKeys == null || pageKeys.isEmpty()) return List.of();
        return pageKeys.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(ALLOWED_PAGE_KEYS::contains)
                .distinct()
                .toList();
    }

    private List<String> sanitizeMemberPageKeysForGroup(UserGroup group, List<String> requestedPageKeys) {
        List<String> sanitized = sanitizePageKeys(requestedPageKeys);
        Set<String> groupPageKeys = new LinkedHashSet<>(parseTeamNamesCsv(group.getPageKeysCsv()));
        List<String> filtered = sanitized.stream()
                .filter(groupPageKeys::contains)
                .toList();
        if (filtered.size() != sanitized.size()) {
            throw new IllegalStateException("Member visibility can only include pages selected on the group");
        }
        return filtered;
    }

    private void applyGroupPageVisibilityToMembers(UserGroup group, List<String> previousGroupPages, List<String> nextGroupPages) {
        List<UserGroupMember> members = userGroupMemberRepository.findByGroupOrderByUserUsernameAsc(group);
        if (members.isEmpty()) {
            return;
        }

        String nextCsv = String.join(",", nextGroupPages);
        boolean changed = false;
        for (UserGroupMember member : members) {
            String currentCsv = StringUtils.hasText(member.getPageKeysCsv()) ? member.getPageKeysCsv().trim() : "";
            if (!currentCsv.equals(nextCsv)) {
                member.setPageKeysCsv(nextCsv);
                changed = true;
            }
        }

        if (changed) {
            userGroupMemberRepository.saveAll(members);
        }
    }

    private List<String> resolveGroupPageKeysForActor(User actor, List<String> requestedPageKeys, UserGroup existingGroup) {
        if (canEditPageVisibility(actor)) {
            return sanitizePageKeys(requestedPageKeys);
        }
        if (existingGroup != null) {
            return parseTeamNamesCsv(existingGroup.getPageKeysCsv());
        }
        return DEFAULT_PAGE_KEYS;
    }

    private UserGroupMemberScope resolveMemberScope(String rawValue) {
        if (!StringUtils.hasText(rawValue)) {
            return UserGroupMemberScope.NONE;
        }
        try {
            return UserGroupMemberScope.valueOf(rawValue.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid member scope: " + rawValue);
        }
    }

    private List<Role> allowedRolesForMemberScope(UserGroupMemberScope scope) {
        UserGroupMemberScope normalized = scope == null ? UserGroupMemberScope.NONE : scope;
        return switch (normalized) {
            case ADMINS -> List.of(Role.ADMIN);
            case MANAGERS -> List.of(Role.MANAGER);
            case TEAM_LEADS -> List.of(Role.TEAM_LEAD);
            case EMPLOYEES -> List.of(Role.EMPLOYEE);
            case NONE -> List.of(Role.MANAGER, Role.TEAM_LEAD, Role.EMPLOYEE);
        };
    }

    private boolean canAddRoleToGroup(UserGroupMemberScope scope, Role targetRole, boolean canSuperAdminAssignAdmin) {
        if (canSuperAdminAssignAdmin) {
            return true;
        }
        UserGroupMemberScope normalized = scope == null ? UserGroupMemberScope.NONE : scope;
        return switch (normalized) {
            case ADMINS -> targetRole == Role.ADMIN;
            case MANAGERS -> targetRole == Role.MANAGER;
            case TEAM_LEADS -> targetRole == Role.TEAM_LEAD;
            case EMPLOYEES -> targetRole == Role.EMPLOYEE;
            case NONE -> targetRole == Role.MANAGER || targetRole == Role.TEAM_LEAD || targetRole == Role.EMPLOYEE;
        };
    }

    private boolean requiresTeamSelection(UserGroupMemberScope scope) {
        UserGroupMemberScope normalized = scope == null ? UserGroupMemberScope.NONE : scope;
        return normalized == UserGroupMemberScope.TEAM_LEADS
                || normalized == UserGroupMemberScope.EMPLOYEES;
    }

    private ResolvedGroupScope resolveScopeForCreate(User actor,
                                                     CreateUserGroupRequest request,
                                                     UserGroupMemberScope memberScope) {
        return resolveScopeSelection(
                request.getHeadOfficeId(),
                request.getBranchId(),
                request.getDepartmentId(),
                request.getDepartmentIds(),
                request.getTeamNames(),
                memberScope,
                null
        );
    }

    private ResolvedGroupScope resolveScopeForUpdate(User actor,
                                                     UpdateUserGroupRequest request,
                                                     UserGroupMemberScope memberScope,
                                                     UserGroup existingGroup) {
        return resolveScopeSelection(
                request.getHeadOfficeId(),
                request.getBranchId(),
                request.getDepartmentId(),
                request.getDepartmentIds(),
                request.getTeamNames(),
                memberScope,
                existingGroup
        );
    }

    private ResolvedGroupScope resolveScopeSelection(Long headOfficeId,
                                                     Long branchId,
                                                     Long departmentId,
                                                     List<Long> departmentIds,
                                                     List<String> requestedTeamNames,
                                                     UserGroupMemberScope memberScope,
                                                     UserGroup existingGroup) {
        Long resolvedHeadOfficeId = headOfficeId != null ? headOfficeId : resolveExistingHeadOfficeId(existingGroup);
        Long resolvedBranchId = branchId != null ? branchId : resolveExistingBranchId(existingGroup);
        Long resolvedDepartmentId = departmentId != null ? departmentId : resolveExistingDepartmentId(existingGroup);

        HeadOfficeMaster headOffice = null;
        if (resolvedHeadOfficeId != null) {
            headOffice = findActiveHeadOffice(resolvedHeadOfficeId);
        }

        BranchMaster branch = null;
        if (resolvedBranchId != null) {
            branch = branchMasterRepository.findByIdAndDeletedFalse(resolvedBranchId)
                    .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
            if (headOffice != null && !resolvedHeadOfficeId.equals(branch.getHeadOfficeId())) {
                throw new IllegalStateException("Selected branch does not belong to the selected head office");
            }
            if (headOffice == null) {
                headOffice = findActiveHeadOffice(branch.getHeadOfficeId());
                resolvedHeadOfficeId = headOffice.getId();
            }
        }

        UserDepartment department = null;
        List<UserDepartment> departments = new ArrayList<>();
        List<Long> resolvedDepartmentIds = new ArrayList<>();
        if (resolvedDepartmentId != null) {
            department = userDepartmentRepository.findById(resolvedDepartmentId)
                    .orElseThrow(() -> new EntityNotFoundException("Department not found"));
            if (branch != null && !resolvedBranchId.equals(department.getBranch().getId())) {
                throw new IllegalStateException("Selected department does not belong to the selected branch");
            }
            if (branch == null) {
                branch = branchMasterRepository.findByIdAndDeletedFalse(department.getBranch().getId())
                        .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
                resolvedBranchId = branch.getId();
                if (headOffice == null) {
                    headOffice = findActiveHeadOffice(branch.getHeadOfficeId());
                    resolvedHeadOfficeId = headOffice.getId();
                }
                if (!resolvedHeadOfficeId.equals(branch.getHeadOfficeId())) {
                    throw new IllegalStateException("Selected branch does not belong to the selected head office");
                }
            }
        }
        List<Long> requestedDepartmentIds = sanitizeLongIds(departmentIds);
        if (!requestedDepartmentIds.isEmpty()) {
            for (Long departmentKey : requestedDepartmentIds) {
                UserDepartment row = userDepartmentRepository.findById(departmentKey)
                        .orElseThrow(() -> new EntityNotFoundException("Department not found"));
                if (branch != null && !resolvedBranchId.equals(row.getBranch().getId())) {
                    throw new IllegalStateException("Selected department does not belong to the selected branch");
                }
                if (branch == null) {
                    branch = branchMasterRepository.findByIdAndDeletedFalse(row.getBranch().getId())
                            .orElseThrow(() -> new EntityNotFoundException("Branch not found"));
                    resolvedBranchId = branch.getId();
                    if (headOffice == null) {
                        headOffice = findActiveHeadOffice(branch.getHeadOfficeId());
                        resolvedHeadOfficeId = headOffice.getId();
                    }
                    if (!resolvedHeadOfficeId.equals(branch.getHeadOfficeId())) {
                        throw new IllegalStateException("Selected branch does not belong to the selected head office");
                    }
                }
                departments.add(row);
                resolvedDepartmentIds.add(row.getId());
            }
        } else if (department != null) {
            departments.add(department);
            resolvedDepartmentIds.add(department.getId());
        }

        if (department == null && !departments.isEmpty()) {
            department = departments.getFirst();
            if (resolvedDepartmentId == null) {
                resolvedDepartmentId = department.getId();
            }
        }

        if (memberScope == UserGroupMemberScope.ADMINS) {
            resolvedDepartmentId = null;
            department = null;
            departments = List.of();
            resolvedDepartmentIds = List.of();
        } else if (department == null && (memberScope == UserGroupMemberScope.MANAGERS
                || memberScope == UserGroupMemberScope.TEAM_LEADS
                || memberScope == UserGroupMemberScope.EMPLOYEES
                || memberScope == UserGroupMemberScope.NONE)) {
            throw new IllegalStateException("Department is required");
        }

        List<String> sanitizedTeamNames = sanitizeTeamNames(requestedTeamNames);
        if (requiresTeamSelection(memberScope)) {
            if (department == null) {
                throw new IllegalStateException("Department is required");
            }
            if (sanitizedTeamNames.isEmpty()) {
                throw new IllegalStateException("At least one designation is required");
            }
            sanitizedTeamNames = validateDesignationNamesForDepartment(department.getId(), sanitizedTeamNames);
            departments = List.of(department);
            resolvedDepartmentIds = List.of(department.getId());
        } else if (memberScope == UserGroupMemberScope.MANAGERS) {
            if (departments.isEmpty()) {
                throw new IllegalStateException("At least one department is required");
            }
            department = departments.getFirst();
        } else if (!departments.isEmpty()) {
            department = departments.getFirst();
        } else {
            sanitizedTeamNames = List.of();
        }

        String institutionName = branch == null ? "" : trimOrEmpty(branch.getName());
        List<String> departmentNames = departments.stream()
                .map(UserDepartment::getName)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();
        String departmentName = String.join(",", departmentNames);
        return new ResolvedGroupScope(
                resolvedHeadOfficeId,
                resolvedBranchId,
                resolvedDepartmentId,
                resolvedDepartmentIds,
                institutionName,
                departmentName,
                departmentNames,
                sanitizedTeamNames
        );
    }

    private Long resolveExistingHeadOfficeId(UserGroup existingGroup) {
        BranchMaster branch = resolveExistingBranch(existingGroup);
        return branch == null ? null : branch.getHeadOfficeId();
    }

    private Long resolveExistingBranchId(UserGroup existingGroup) {
        BranchMaster branch = resolveExistingBranch(existingGroup);
        return branch == null ? null : branch.getId();
    }

    private Long resolveExistingDepartmentId(UserGroup existingGroup) {
        if (existingGroup == null || !StringUtils.hasText(existingGroup.getDepartmentName())) {
            return null;
        }
        BranchMaster branch = resolveExistingBranch(existingGroup);
        if (branch == null) {
            return null;
        }
        List<String> departmentNames = parseDepartmentNamesCsv(existingGroup.getDepartmentName());
        for (String departmentName : departmentNames) {
            Long resolved = findUserDepartmentByBranchAndName(branch.getId(), departmentName)
                    .map(UserDepartment::getId)
                    .orElse(null);
            if (resolved != null) {
                return resolved;
            }
        }
        return null;
    }

    private List<Long> resolveExistingDepartmentIds(UserGroup existingGroup) {
        if (existingGroup == null || !StringUtils.hasText(existingGroup.getDepartmentName())) {
            return List.of();
        }
        BranchMaster branch = resolveExistingBranch(existingGroup);
        if (branch == null) {
            return List.of();
        }
        List<Long> ids = new ArrayList<>();
        for (String departmentName : parseDepartmentNamesCsv(existingGroup.getDepartmentName())) {
            findUserDepartmentByBranchAndName(branch.getId(), departmentName)
                    .map(UserDepartment::getId)
                    .ifPresent(ids::add);
        }
        return ids.stream().distinct().toList();
    }

    private BranchMaster resolveExistingBranch(UserGroup existingGroup) {
        if (existingGroup == null || !StringUtils.hasText(existingGroup.getInstitutionName())) {
            return null;
        }
        return branchMasterRepository
                .findFirstByNameIgnoreCaseAndDeletedFalseOrderByIdAsc(existingGroup.getInstitutionName().trim())
                .orElse(null);
    }

    private List<String> validateDesignationNamesForDepartment(Long departmentId, List<String> requestedTeamNames) {
        List<String> availableDesignations = userDesignationRepository
                .findByUserDepartmentId(departmentId)
                .stream()
                .map(UserDesignation::getName)
                .filter(StringUtils::hasText)
                .map(String::trim)
                .toList();
        Map<String, String> availableByLower = availableDesignations.stream()
                .collect(Collectors.toMap(this::normalizeLower, name -> name, (a, b) -> a, LinkedHashMap::new));
        Set<String> resolved = new LinkedHashSet<>();
        for (String name : requestedTeamNames) {
            String canonical = availableByLower.get(normalizeLower(name));
            if (canonical == null) {
                throw new AccessDeniedException("Selected designation is outside the selected department: " + name);
            }
            resolved.add(canonical);
        }
        return new ArrayList<>(resolved);
    }

    private List<Long> sanitizeLongIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return ids.stream()
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
    }

    private String requiredScopeValue(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(message);
        }
        return value.trim();
    }

    private String trimOrEmpty(String value) {
        return StringUtils.hasText(value) ? value.trim() : "";
    }

    private String normalizeLower(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : "";
    }

    private boolean textEquals(String left, String right) {
        return normalizeLower(left).equals(normalizeLower(right));
    }

    private UserGroupResponse toResponse(UserGroup group) {
        UserGroupResponse response = new UserGroupResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        response.setCanDelete(!group.isSystemGroup());
        response.setMembers(resolveMembers(group));
        ResolvedGroupScope scope = resolveStoredGroupScope(group);
        response.setHeadOfficeId(scope.headOfficeId());
        response.setBranchId(scope.branchId());
        response.setDepartmentId(scope.departmentId());
        response.setDepartmentIds(scope.departmentIds());
        response.setInstitutionName(group.getInstitutionName());
        response.setDepartmentName(scope.departmentName());
        response.setDepartmentNames(scope.departmentNames());
        response.setTeamNames(parseTeamNames(group));
        response.setPageKeys(parseTeamNamesCsv(group.getPageKeysCsv()));
        response.setMemberScope(group.getMemberScope() == null ? null : group.getMemberScope().name());
        return response;
    }

    private ResolvedGroupScope resolveStoredGroupScope(UserGroup group) {
        BranchMaster branch = resolveExistingBranch(group);
        Long headOfficeId = branch == null ? null : branch.getHeadOfficeId();
        Long branchId = branch == null ? null : branch.getId();
        Long departmentId = null;
        List<Long> departmentIds = resolveExistingDepartmentIds(group);
        List<String> departmentNames = parseDepartmentNamesCsv(group.getDepartmentName());
        if (!departmentIds.isEmpty()) {
            departmentId = departmentIds.getFirst();
        } else if (branch != null && StringUtils.hasText(group.getDepartmentName())) {
            departmentId = findUserDepartmentByBranchAndName(branch.getId(), group.getDepartmentName())
                    .map(UserDepartment::getId)
                    .orElse(null);
        }
        return new ResolvedGroupScope(
                headOfficeId,
                branchId,
                departmentId,
                departmentIds,
                branch == null ? trimOrEmpty(group.getInstitutionName()) : trimOrEmpty(branch.getName()),
                trimOrEmpty(group.getDepartmentName()),
                departmentNames,
                parseTeamNames(group)
        );
    }

    private java.util.Optional<UserDepartment> findUserDepartmentByBranchAndName(Long branchId, String name) {
        if (branchId == null || !StringUtils.hasText(name)) {
            return java.util.Optional.empty();
        }
        return userDepartmentRepository.findByBranchId(branchId).stream()
                .filter(row -> StringUtils.hasText(row.getName()) && row.getName().trim().equalsIgnoreCase(name.trim()))
                .findFirst();
    }

    private long resolveMembers(UserGroup group) {
        if (group.getMemberScope() == UserGroupMemberScope.ADMINS) {
            if (!StringUtils.hasText(group.getInstitutionName())) {
                return 0;
            }
            return userRepository.countActiveAdminsByBranch(group.getInstitutionName());
        }
        if (group.getMemberScope() == UserGroupMemberScope.MANAGERS) {
            List<String> departments = parseDepartmentNamesCsv(group.getDepartmentName());
            if (!StringUtils.hasText(group.getInstitutionName()) || departments.isEmpty()) {
                return 0;
            }
            long total = 0;
            for (String departmentName : departments) {
                total += userRepository.countActiveManagersInScope(
                        group.getInstitutionName(),
                        departmentName,
                        ""
                );
            }
            return total;
        }
        if (group.getMemberScope() == UserGroupMemberScope.TEAM_LEADS) {
            List<String> departments = parseDepartmentNamesCsv(group.getDepartmentName());
            if (!StringUtils.hasText(group.getInstitutionName()) || departments.isEmpty()) {
                return 0;
            }
            List<String> teams = parseTeamNames(group).stream().map(this::normalizeLower).toList();
            if (teams.isEmpty()) {
                return 0;
            }
            return countUsersByDepartmentsAndTeams(List.of(Role.TEAM_LEAD), group.getInstitutionName(), departments, teams);
        }
        if (group.getMemberScope() == UserGroupMemberScope.EMPLOYEES) {
            List<String> departments = parseDepartmentNamesCsv(group.getDepartmentName());
            if (!StringUtils.hasText(group.getInstitutionName()) || departments.isEmpty()) {
                return 0;
            }
            List<String> teams = parseTeamNames(group).stream().map(this::normalizeLower).toList();
            if (teams.isEmpty()) {
                return 0;
            }
            return countUsersByDepartmentsAndTeams(List.of(Role.EMPLOYEE), group.getInstitutionName(), departments, teams);
        }
        return userGroupMemberRepository.countByGroup(group);
    }

    private HeadOfficeMaster findActiveHeadOffice(Long headOfficeId) {
        if (headOfficeId == null) {
            return null;
        }
        HeadOfficeMaster headOffice = headOfficeMasterRepository.findById(headOfficeId)
                .orElseThrow(() -> new IllegalStateException("Selected head office does not exist or is inactive"));
        if (Boolean.TRUE.equals(headOffice.getDeleted())) {
            throw new IllegalStateException("Selected head office does not exist or is inactive");
        }
        return headOffice;
    }

    private UserGroupAssignableUserResponse toAssignableUserResponse(User user) {
        UserGroupAssignableUserResponse response = new UserGroupAssignableUserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setRole(user.getRole() == null ? null : user.getRole().name());
        return response;
    }

    private UserGroupMemberResponse toMemberResponse(UserGroupMember member) {
        UserGroupMemberResponse response = new UserGroupMemberResponse();
        response.setUserId(member.getUser().getId());
        response.setUsername(member.getUser().getUsername());
        response.setRole(member.getUser().getRole() == null ? null : member.getUser().getRole().name());
        response.setPageKeys(parseTeamNamesCsv(member.getPageKeysCsv()));
        return response;
    }

    private UserGroupSummaryResponse toSummaryResponse(UserGroup group) {
        UserGroupSummaryResponse response = new UserGroupSummaryResponse();
        response.setId(group.getId());
        response.setName(group.getName());
        return response;
    }
}
