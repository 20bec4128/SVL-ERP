package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.AuditLogResponse;
import com.nexorcrm.backend.dto.CreateUserRequest;
import com.nexorcrm.backend.dto.ResetPasswordResponse;
import com.nexorcrm.backend.dto.UpdateUserProfileRequest;
import com.nexorcrm.backend.dto.UserLogResponse;
import com.nexorcrm.backend.dto.UserResponse;
import com.nexorcrm.backend.dto.UserSessionResponse;
import com.nexorcrm.backend.entity.ActivationStatus;
import com.nexorcrm.backend.entity.Employee;
import com.nexorcrm.backend.entity.AuditLog;
import com.nexorcrm.backend.entity.BranchMaster;
import com.nexorcrm.backend.entity.DepartmentMaster;
import com.nexorcrm.backend.entity.DesignationMaster;
import com.nexorcrm.backend.entity.RefreshToken;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.repo.AuditLogRepository;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.DepartmentMasterRepository;
import com.nexorcrm.backend.repo.DesignationMasterRepository;
import com.nexorcrm.backend.repo.EmployeeRepository;
import com.nexorcrm.backend.repo.RefreshTokenRepository;
import com.nexorcrm.backend.repo.UserRepository;
import com.nexorcrm.backend.repo.UserGroupMemberRepository;
import com.nexorcrm.backend.security.RolePermissionUtil;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@Transactional
public class SuperAdminService {

    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%&*!?";
    private static final int TEMP_PASSWORD_LENGTH = 12;
    private static final long REFRESH_TOKEN_DAYS = 7L;
    private static final String STRONG_PASSWORD_PATTERN = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$";

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchMasterRepository branchMasterRepository;
    private final DepartmentMasterRepository departmentMasterRepository;
    private final DesignationMasterRepository designationMasterRepository;
    private final UserGroupMemberRepository userGroupMemberRepository;
    private final RefreshTokenService refreshTokenService;
    private final SecuritySettingsService securitySettingsService;
    private final SecurityPolicySettingsService securityPolicySettingsService;
    private final AuditService auditService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();

    public SuperAdminService(UserRepository userRepository,
                             AuditLogRepository auditLogRepository,
                             RefreshTokenRepository refreshTokenRepository,
                             EmployeeRepository employeeRepository,
                             BranchMasterRepository branchMasterRepository,
                             DepartmentMasterRepository departmentMasterRepository,
                             DesignationMasterRepository designationMasterRepository,
                             UserGroupMemberRepository userGroupMemberRepository,
                             RefreshTokenService refreshTokenService,
                             SecuritySettingsService securitySettingsService,
                             SecurityPolicySettingsService securityPolicySettingsService,
                             AuditService auditService) {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.employeeRepository = employeeRepository;
        this.branchMasterRepository = branchMasterRepository;
        this.departmentMasterRepository = departmentMasterRepository;
        this.designationMasterRepository = designationMasterRepository;
        this.userGroupMemberRepository = userGroupMemberRepository;
        this.refreshTokenService = refreshTokenService;
        this.securitySettingsService = securitySettingsService;
        this.securityPolicySettingsService = securityPolicySettingsService;
        this.auditService = auditService;
    }

    public UserResponse createAdmin(CreateUserRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();
        if (securitySettingsService.isUsernameDisallowed(username)) {
            throw new IllegalStateException("This username is not allowed");
        }

        if (userRepository.existsByUsernameIgnoreCaseAndIsDeletedFalse(username)) {
            throw new IllegalStateException("Username already exists");
        }
        if (userRepository.existsByEmailIgnoreCaseAndIsDeletedFalse(email)) {
            throw new IllegalStateException("Email already exists");
        }

        securityPolicySettingsService.validatePassword(request.getPassword());

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(normalizeNullable(request.getFirstName()));
        user.setLastName(normalizeNullable(request.getLastName()));
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.EMPLOYEE);
        user.setActivationStatus(ActivationStatus.PENDING);
        user.setActive(true);
        user.setForcePasswordChange(false);
        user.setPasswordUpdatedAt(LocalDateTime.now());
        user.setCreatedBy("SYSTEM");

        User saved = userRepository.save(user);
        auditService.log("CREATE_USER", "Created pending user", saved.getEmail());
        return toUserResponse(saved);
    }

    public UserResponse createPendingUser(CreateUserRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.SUPER_ADMIN
                && actor.getRole() != Role.ADMIN
                && actor.getRole() != Role.MANAGER
                && actor.getRole() != Role.TEAM_LEAD) {
            throw new AccessDeniedException("You do not have permission to create users");
        }

        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();
        if (securitySettingsService.isUsernameDisallowed(username)) {
            throw new IllegalStateException("This username is not allowed");
        }

        if (userRepository.existsByUsernameIgnoreCaseAndIsDeletedFalse(username)) {
            throw new IllegalStateException("Username already exists");
        }
        if (userRepository.existsByEmailIgnoreCaseAndIsDeletedFalse(email)) {
            throw new IllegalStateException("Email already exists");
        }
        if (!StringUtils.hasText(request.getConfirmPassword())) {
            throw new IllegalStateException("Confirm Password is required");
        }
        if (!request.getPassword().trim().equals(request.getConfirmPassword().trim())) {
            throw new IllegalStateException("Password and Confirm Password do not match");
        }

        securityPolicySettingsService.validatePassword(request.getPassword());

        Role requestedRole = parseRequestedRole(request);

        if (requestedRole == Role.CUSTOMER) {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setFirstName(normalizeNullable(request.getFirstName()));
            user.setLastName(normalizeNullable(request.getLastName()));
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setRole(Role.CUSTOMER);
            user.setActivationStatus(ActivationStatus.ACTIVE);
            user.setActive(true);
            user.setForcePasswordChange(false);
            user.setPasswordUpdatedAt(LocalDateTime.now());
            user.setCreatedBy(actor.getEmail());

            User saved = userRepository.save(user);
            auditService.log("CREATE_CUSTOMER", "Created customer user", saved.getEmail());
            return toUserResponse(saved);
        }

        if (request.getEmployeeId() == null) {
            throw new IllegalStateException("Please select an employee");
        }
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .filter(found -> !Boolean.TRUE.equals(found.getDeleted()))
                .orElseThrow(() -> new EntityNotFoundException("Selected employee not found"));
        String employeeEmail = resolveEmployeeEmail(employee);
        if (!StringUtils.hasText(employeeEmail)) {
            throw new IllegalStateException("Selected employee must have an email");
        }
        if (!employeeEmail.equals(email)) {
            throw new IllegalStateException("Selected employee email does not match the user email");
        }
        String employeeBranchName = resolveEmployeeBranchName(employee);
        if (StringUtils.hasText(request.getInstitution()) && !textEquals(request.getInstitution(), employeeBranchName)) {
            throw new IllegalStateException("Selected employee does not belong to the selected branch");
        }
        String branchName = required(employeeBranchName, "Branch is required");
        String institutionName = StringUtils.hasText(request.getInstitution())
                ? request.getInstitution().trim()
                : branchName;
        String departmentName = normalizeNullable(request.getDepartmentName());
        String teamName = normalizeNullable(request.getTeam());
        if (requestedRole == Role.MANAGER || requestedRole == Role.TEAM_LEAD || requestedRole == Role.EMPLOYEE) {
            departmentName = required(departmentName, "Department Name is required for role assignment");
        }
        if (requestedRole == Role.TEAM_LEAD || requestedRole == Role.EMPLOYEE) {
            teamName = required(teamName, "Team is required for role assignment");
        }
        assertActorCanManagePlacement(
                actor,
                institutionName,
                departmentName,
                teamName,
                actor.getRole() == Role.TEAM_LEAD
                        ? "You can only create users inside your team"
                        : actor.getRole() == Role.MANAGER
                        ? "You can only create users inside your department"
                        : "You can only create users inside your branch"
        );

        if (!RolePermissionUtil.canAssign(actor.getRole(), requestedRole)) {
            throw new AccessDeniedException("You do not have permission to assign this role");
        }
        assertRolePlacementConstraints(requestedRole, null, institutionName, departmentName, teamName);

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(normalizeNullable(request.getFirstName()));
        user.setLastName(normalizeNullable(request.getLastName()));
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(requestedRole);
        user.setInstitutionName(institutionName);
        user.setDepartmentName(departmentName);
        user.setTeamName(teamName);
        user.setEmployeeId(employee.getId());
        user.setActivationStatus(ActivationStatus.PENDING);
        user.setActive(false);
        user.setForcePasswordChange(false);
        user.setPasswordUpdatedAt(LocalDateTime.now());
        user.setCreatedBy(actor.getEmail());

        User saved = userRepository.save(user);
        auditService.log("CREATE_USER_PENDING", "Created user awaiting activation", saved.getEmail());
        return toUserResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getVisibleUsers(Pageable pageable, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() == Role.EMPLOYEE) {
            if (pageable.getPageNumber() > 0) {
                return Page.empty(pageable);
            }
            return new PageImpl<>(
                    Collections.singletonList(toUserResponse(actor)),
                    pageable,
                    1
            );
        }

        List<Role> visibleRoles = RolePermissionUtil.getVisibleRoles(actor.getRole());
        List<ActivationStatus> statuses = List.of(ActivationStatus.ACTIVE, ActivationStatus.PENDING);
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return userRepository.findByRoleInAndActivationStatusInAndIsDeletedFalseOrderByRoleHierarchy(
                    visibleRoles,
                    statuses,
                    pageable
            ).map(this::toUserResponse);
        }
        if (actor.getRole() == Role.ADMIN) {
            assertActorHasBranchScope(actor);
            return userRepository.findByRoleInAndActivationStatusInAndBranchScopeOrderByRoleHierarchy(
                    visibleRoles,
                    statuses,
                    actor.getInstitutionName(),
                    pageable
            ).map(this::toUserResponse);
        }
        if (actor.getRole() == Role.MANAGER) {
            assertActorHasDepartmentScope(actor);
            return userRepository.findByRoleInAndActivationStatusInAndDepartmentScopeOrderByRoleHierarchy(
                    visibleRoles,
                    statuses,
                    actor.getInstitutionName(),
                    actor.getDepartmentName(),
                    pageable
            ).map(this::toUserResponse);
        }
        if (actor.getRole() == Role.TEAM_LEAD) {
            assertActorHasTeamScope(actor);
            return userRepository.findByRoleInAndActivationStatusInAndTeamScopeOrderByRoleHierarchy(
                    visibleRoles,
                    statuses,
                    actor.getInstitutionName(),
                    actor.getDepartmentName(),
                    actor.getTeamName(),
                    pageable
            ).map(this::toUserResponse);
        }
        return Page.empty(pageable);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> getPendingUsers(Pageable pageable, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.SUPER_ADMIN
                && actor.getRole() != Role.ADMIN
                && actor.getRole() != Role.MANAGER
                && actor.getRole() != Role.TEAM_LEAD) {
            throw new AccessDeniedException("You do not have permission to view pending users");
        }

        List<Role> visibleRoles = RolePermissionUtil.getAssignableRoles(actor.getRole());
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return userRepository.findByRoleInAndActivationStatusInAndIsDeletedFalseOrderByRoleHierarchy(
                    visibleRoles,
                    List.of(ActivationStatus.PENDING),
                    pageable
            ).map(this::toUserResponse);
        }
        if (actor.getRole() == Role.ADMIN) {
            assertActorHasBranchScope(actor);
            return userRepository.findByRoleInAndActivationStatusInAndBranchScopeOrderByRoleHierarchy(
                    visibleRoles,
                    List.of(ActivationStatus.PENDING),
                    actor.getInstitutionName(),
                    pageable
            ).map(this::toUserResponse);
        }
        if (actor.getRole() == Role.MANAGER) {
            assertActorHasDepartmentScope(actor);
            return userRepository.findByRoleInAndActivationStatusInAndDepartmentScopeOrderByRoleHierarchy(
                    visibleRoles,
                    List.of(ActivationStatus.PENDING),
                    actor.getInstitutionName(),
                    actor.getDepartmentName(),
                    pageable
            ).map(this::toUserResponse);
        }
        if (actor.getRole() == Role.TEAM_LEAD) {
            assertActorHasTeamScope(actor);
            return userRepository.findByRoleInAndActivationStatusInAndTeamScopeOrderByRoleHierarchy(
                    visibleRoles,
                    List.of(ActivationStatus.PENDING),
                    actor.getInstitutionName(),
                    actor.getDepartmentName(),
                    actor.getTeamName(),
                    pageable
            ).map(this::toUserResponse);
        }
        return Page.empty(pageable);
    }

    public UserResponse updateUserProfile(Long userId, UpdateUserProfileRequest request, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        User target = findUser(userId);
        assertCanEdit(actor, target, "You do not have permission to edit this user profile");

        String username = StringUtils.hasText(request.getUsername()) ? request.getUsername().trim() : target.getUsername();
        String email = StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase() : target.getEmail();
        String firstName = normalizeNullable(request.getFirstName());
        String lastName = normalizeNullable(request.getLastName());
        String newPassword = StringUtils.hasText(request.getNewPassword()) ? request.getNewPassword().trim() : null;
        String confirmPassword = StringUtils.hasText(request.getConfirmPassword()) ? request.getConfirmPassword().trim() : null;

        if (!target.getUsername().equalsIgnoreCase(username) && userRepository.existsByUsernameIgnoreCaseAndIsDeletedFalse(username)) {
            throw new IllegalStateException("Username already exists");
        }
        if (!target.getUsername().equalsIgnoreCase(username) && securitySettingsService.isUsernameDisallowed(username)) {
            throw new IllegalStateException("This username is not allowed");
        }
        if (!target.getEmail().equalsIgnoreCase(email) && userRepository.existsByEmailIgnoreCaseAndIsDeletedFalse(email)) {
            throw new IllegalStateException("Email already exists");
        }
        if ((newPassword != null || confirmPassword != null) && !StringUtils.hasText(newPassword)) {
            throw new IllegalStateException("New Password is required when Confirm Password is set");
        }
        if ((newPassword != null || confirmPassword != null) && !StringUtils.hasText(confirmPassword)) {
            throw new IllegalStateException("Confirm Password is required when New Password is set");
        }
        if (StringUtils.hasText(newPassword)) {
            if (!newPassword.equals(confirmPassword)) {
                throw new IllegalStateException("New Password and Confirm Password do not match");
            }
            securityPolicySettingsService.validatePassword(newPassword);
        }

        target.setUsername(username);
        target.setEmail(email);
        target.setFirstName(firstName);
        target.setLastName(lastName);

        if (actor.getRole() == Role.SUPER_ADMIN) {
            if (StringUtils.hasText(request.getInstitutionName())) {
                target.setInstitutionName(request.getInstitutionName().trim());
            }
            if (StringUtils.hasText(request.getDepartmentName())) {
                target.setDepartmentName(request.getDepartmentName().trim());
            }
            if (StringUtils.hasText(request.getTeamName())) {
                target.setTeamName(request.getTeamName().trim());
            } else if (request.getTeamName() != null && request.getTeamName().isEmpty()) {
                target.setTeamName(null);
            }
        } else if (actor.getRole() == Role.ADMIN) {
            if (StringUtils.hasText(request.getDepartmentName())) {
                target.setDepartmentName(request.getDepartmentName().trim());
            }
            if (StringUtils.hasText(request.getTeamName())) {
                target.setTeamName(request.getTeamName().trim());
            } else if (request.getTeamName() != null && request.getTeamName().isEmpty()) {
                target.setTeamName(null);
            }
        } else if (actor.getRole() == Role.MANAGER) {
            if (StringUtils.hasText(request.getTeamName())) {
                target.setTeamName(request.getTeamName().trim());
            } else if (request.getTeamName() != null && request.getTeamName().isEmpty()) {
                target.setTeamName(null);
            }
        }

        if (StringUtils.hasText(newPassword)) {
            target.setPasswordHash(passwordEncoder.encode(newPassword));
            target.setForcePasswordChange(false);
            target.setPasswordUpdatedAt(LocalDateTime.now());
            refreshTokenService.revokeAllUserTokens(target);
            auditService.log("PASSWORD_SET", "Password updated via profile edit", target.getEmail());
        }
        User saved = userRepository.save(target);
        auditService.log("PROFILE_UPDATE", "Updated user profile", target.getEmail());
        return toUserResponse(saved);
    }

    public UserResponse updateUserStatus(Long userId, boolean active, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        User target = findUser(userId);
        assertCanEdit(actor, target, "You do not have permission to change this user status");

        target.setActive(active);
        if (active) {
            target.setActivationStatus(ActivationStatus.ACTIVE);
        }
        User saved = userRepository.save(target);
        auditService.log("USER_STATUS_CHANGE", "Set active=" + active, target.getEmail());
        return toUserResponse(saved);
    }

    public UserResponse updateUserRole(Long userId, Role role, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        User target = findUser(userId);

        assertCanEdit(actor, target, "You do not have permission to change this user's role");
        if (!RolePermissionUtil.canAssign(actor.getRole(), role)) {
            throw new AccessDeniedException("You are not allowed to assign this role");
        }
        if (actor.getId().equals(target.getId())) {
            throw new AccessDeniedException("You cannot change your own role");
        }
        assertRolePlacementConstraints(
                role,
                target.getId(),
                target.getInstitutionName(),
                target.getDepartmentName(),
                target.getTeamName()
        );

        target.setRole(role);
        target.setActivationStatus(ActivationStatus.ACTIVE);
        target.setActive(true);
        User saved = userRepository.save(target);
        auditService.log("ROLE_CHANGE", "Set role=" + role.name(), target.getEmail());
        return toUserResponse(saved);
    }

    public ResetPasswordResponse resetUserPassword(Long userId, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        User target = findUser(userId);
        assertCanEdit(actor, target, "You do not have permission to reset this user's password");

        String tempPassword = generateTemporaryPassword();
        target.setPasswordHash(passwordEncoder.encode(tempPassword));
        target.setForcePasswordChange(true);
        target.setPasswordUpdatedAt(LocalDateTime.now());
        userRepository.save(target);

        refreshTokenService.revokeAllUserTokens(target);
        auditService.log("PASSWORD_RESET", "Password reset", target.getEmail());
        return new ResetPasswordResponse("Password reset successful", tempPassword);
    }

    public void deleteUser(Long userId, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        User target = findUser(userId);

        if (target.getRole() == Role.SUPER_ADMIN) {
            throw new AccessDeniedException("You cannot delete a SUPER_ADMIN user");
        }
        if (actor.getId().equals(target.getId())) {
            throw new AccessDeniedException("You cannot delete your own account");
        }
        if (!RolePermissionUtil.canAssign(actor.getRole(), target.getRole())) {
            throw new AccessDeniedException("You do not have permission to delete this user");
        }
        if (!canManageWithinOrgScope(actor, target)) {
            throw new AccessDeniedException("You do not have permission to delete users outside your scope");
        }

        String deletedEmail = target.getEmail();
        refreshTokenRepository.deleteByUser(target);
        userGroupMemberRepository.deleteAll(userGroupMemberRepository.findByUser_IdOrderByIdAsc(target.getId()));
        target.setDeleted(true);
        target.setDeletedAt(LocalDateTime.now());
        userRepository.save(target);
        auditService.log("USER_DELETE", "Soft deleted user account", deletedEmail);
    }

    @Transactional(readOnly = true)
    public List<UserLogResponse> getUserLogs(Long userId, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        User target = findUser(userId);
        assertCanEdit(actor, target, "You do not have permission to view logs for this user");

        return auditLogRepository.findTop100ByTargetUserIgnoreCaseOrderByCreatedAtDesc(target.getEmail())
                .stream()
                .map(this::toUserLogResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserSessionResponse> getUserSessions(Long userId, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        User target = findUser(userId);
        assertCanEdit(actor, target, "You do not have permission to view sessions for this user");

        List<RefreshToken> sessions = refreshTokenRepository.findByUserOrderByExpiryDateDesc(target);
        return sessions.stream().map(token -> toUserSessionResponse(target, token)).toList();
    }

    public void deleteUserSessions(Long userId, List<Long> sessionIds, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        User target = findUser(userId);
        assertCanEdit(actor, target, "You do not have permission to delete sessions for this user");
        if (sessionIds == null || sessionIds.isEmpty()) {
            return;
        }

        List<RefreshToken> sessions = refreshTokenRepository.findByIdInAndUserAndRevokedFalse(sessionIds, target);
        sessions.forEach(token -> token.setRevoked(true));
        refreshTokenRepository.saveAll(sessions);
        auditService.log("SESSION_DELETE", "Deleted " + sessions.size() + " session(s)", target.getEmail());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable).map(this::toAuditLogResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogsForActor(Pageable pageable, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.SUPER_ADMIN
                && actor.getRole() != Role.ADMIN
                && actor.getRole() != Role.MANAGER
                && actor.getRole() != Role.TEAM_LEAD
                && actor.getRole() != Role.EMPLOYEE) {
            throw new AccessDeniedException("You do not have permission to view audit logs");
        }
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return auditLogRepository.findAll(pageable).map(this::toAuditLogResponse);
        }
        List<Role> visibleRoles = RolePermissionUtil.getVisibleRoles(actor.getRole());
        List<String> actorIds = List.of(
                actor.getEmail().trim().toLowerCase(Locale.ROOT),
                actor.getUsername().trim().toLowerCase(Locale.ROOT)
        );
        if (actor.getRole() == Role.EMPLOYEE) {
            return auditLogRepository.findVisibleForActorIds(actorIds, pageable).map(this::toAuditLogResponse);
        }
        if (actor.getRole() == Role.MANAGER) {
            return auditLogRepository.findVisibleForActorIds(actorIds, pageable).map(this::toAuditLogResponse);
        }
        if (actor.getRole() == Role.TEAM_LEAD) {
            assertActorHasTeamScope(actor);
            List<Role> roles = visibleRoles.stream()
                    .filter(role -> role == Role.TEAM_LEAD || role == Role.EMPLOYEE)
                    .toList();
            return auditLogRepository.findVisibleForTeamScope(
                    roles,
                    actor.getInstitutionName(),
                    actor.getDepartmentName(),
                    actor.getTeamName(),
                    pageable
            ).map(this::toAuditLogResponse);
        }

        if (actor.getRole() == Role.ADMIN) {
            assertActorHasDepartmentScope(actor);
            List<Role> roles = visibleRoles.stream()
                    .filter(role -> role == Role.MANAGER || role == Role.EMPLOYEE)
                    .toList();
            return auditLogRepository.findVisibleForDepartmentScopeWithActor(
                    roles,
                    actor.getInstitutionName(),
                    actor.getDepartmentName(),
                    actorIds,
                    pageable
            ).map(this::toAuditLogResponse);
        }
        assertActorHasTeamScope(actor);
        return auditLogRepository.findVisibleForTeamScope(
                visibleRoles,
                actor.getInstitutionName(),
                actor.getDepartmentName(),
                actor.getTeamName(),
                pageable
        ).map(this::toAuditLogResponse);
    }

    public long deleteAllAuditLogs(String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.SUPER_ADMIN && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You do not have permission to delete audit logs");
        }
        long count = auditLogRepository.count();
        auditLogRepository.deleteAllInBatch();
        auditService.log("LOGS_DELETE_ALL", "Deleted all logs", actor.getEmail());
        return count;
    }

    public long deleteAuditLogsOlderThanDays(int days, String actorPrincipal) {
        User actor = resolveActor(actorPrincipal);
        if (actor.getRole() != Role.SUPER_ADMIN && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("You do not have permission to delete audit logs");
        }
        if (days < 1) {
            throw new IllegalStateException("Days must be at least 1");
        }

        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        long deleted = auditLogRepository.deleteOlderThan(cutoff);
        auditService.log("LOGS_DELETE_OLDER_THAN", "Deleted logs older than " + days + " day(s)", actor.getEmail());
        return deleted;
    }

    private User resolveActor(String actorPrincipal) {
        if (!StringUtils.hasText(actorPrincipal)) {
            throw new AccessDeniedException("Unauthenticated actor");
        }
        if (actorPrincipal.contains("@")) {
            return userRepository.findByEmailAndIsDeletedFalse(actorPrincipal.trim().toLowerCase())
                    .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
        }
        return userRepository.findByUsernameAndIsDeletedFalse(actorPrincipal.trim())
                .orElseThrow(() -> new EntityNotFoundException("Actor not found"));
    }

    private User findUser(Long userId) {
        return userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private void assertCanEdit(User actor, User target, String denyMessage) {
        boolean canEdit = RolePermissionUtil.canEdit(
                actor.getRole(),
                actor.getId(),
                target.getRole(),
                target.getId()
        );
        if (!canEdit) {
            throw new AccessDeniedException(denyMessage);
        }
        if (!canManageWithinOrgScope(actor, target)) {
            throw new AccessDeniedException(denyMessage);
        }
    }

    private void assertRolePlacementConstraints(Role requestedRole,
                                                Long excludeUserId,
                                                String institutionName,
                                                String departmentName,
                                                String teamName) {
        if (requestedRole == Role.ADMIN || requestedRole == Role.MANAGER || requestedRole == Role.TEAM_LEAD || requestedRole == Role.EMPLOYEE) {
            institutionName = required(institutionName, "Branch is required for role assignment");
        }
        if (requestedRole == Role.MANAGER || requestedRole == Role.TEAM_LEAD || requestedRole == Role.EMPLOYEE) {
            departmentName = required(departmentName, "Department Name is required for role assignment");
        }
        if (requestedRole == Role.TEAM_LEAD || requestedRole == Role.EMPLOYEE) {
            teamName = required(teamName, "Team is required for role assignment");
        }
        if (requestedRole == Role.ADMIN) {
            long adminCount = excludeUserId == null
                    ? userRepository.countActiveAdminsByBranch(institutionName)
                    : userRepository.countActiveAdminsByBranchExcludingUser(excludeUserId, institutionName);
            if (adminCount > 0) {
                throw new IllegalStateException("Only one ADMIN is allowed per branch");
            }
        }
        if (requestedRole == Role.MANAGER) {
            long managerCount = excludeUserId == null
                    ? userRepository.countActiveManagersInScope(
                    institutionName, departmentName, teamName)
                    : userRepository.countActiveManagersInScopeExcludingUser(
                    excludeUserId, institutionName, departmentName, teamName);
            if (managerCount > 0) {
                throw new IllegalStateException(
                        "Only one MANAGER is allowed per department. Scope checked: "
                                + institutionName + " / " + departmentName
                );
            }
        }
        if (requestedRole == Role.TEAM_LEAD) {
            long teamLeadCount = excludeUserId == null
                    ? userRepository.countActiveTeamLeadsInScope(
                    institutionName, departmentName, teamName)
                    : userRepository.countActiveTeamLeadsInScopeExcludingUser(
                    excludeUserId, institutionName, departmentName, teamName);
            if (teamLeadCount > 0) {
                throw new IllegalStateException(
                        "Only one TEAM_LEAD is allowed per team. Scope checked: "
                                + institutionName + " / " + departmentName + " / " + teamName
                );
            }
        }
    }

    private void assertActorCanManagePlacement(User actor,
                                               String institutionName,
                                               String departmentName,
                                               String teamName,
                                               String denyMessage) {
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (actor.getRole() == Role.ADMIN) {
            assertActorHasBranchScope(actor);
            if (!textEquals(actor.getInstitutionName(), institutionName)) {
                throw new AccessDeniedException(denyMessage);
            }
            return;
        }
        if (actor.getRole() == Role.MANAGER) {
            assertActorHasDepartmentScope(actor);
            boolean inSameDepartment = textEquals(actor.getInstitutionName(), institutionName)
                    && textEquals(actor.getDepartmentName(), departmentName);
            if (!inSameDepartment) {
                throw new AccessDeniedException(denyMessage);
            }
            return;
        }
        if (actor.getRole() == Role.TEAM_LEAD) {
            assertActorHasTeamScope(actor);
            boolean inSameTeam = textEquals(actor.getInstitutionName(), institutionName)
                    && textEquals(actor.getDepartmentName(), departmentName)
                    && textEquals(actor.getTeamName(), teamName);
            if (!inSameTeam) {
                throw new AccessDeniedException(denyMessage);
            }
            return;
        }
        throw new AccessDeniedException(denyMessage);
    }

    private boolean canManageWithinOrgScope(User actor, User target) {
        if (actor.getId().equals(target.getId())) {
            return true;
        }
        if (actor.getRole() == Role.SUPER_ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.ADMIN) {
            if (!hasBranchScope(target)) {
                return true;
            }
            return textEquals(actor.getInstitutionName(), target.getInstitutionName());
        }
        if (actor.getRole() == Role.MANAGER) {
            if (!hasDepartmentScope(target)) {
                return true;
            }
            return textEquals(actor.getInstitutionName(), target.getInstitutionName())
                    && textEquals(actor.getDepartmentName(), target.getDepartmentName());
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

    private boolean textEquals(String a, String b) {
        return normalizeNullable(a) != null && normalizeNullable(a).equalsIgnoreCase(StringUtils.hasText(b) ? b.trim() : "");
    }

    private boolean hasDepartmentScope(User user) {
        return StringUtils.hasText(user.getInstitutionName())
                && StringUtils.hasText(user.getDepartmentName());
    }

    private boolean hasBranchScope(User user) {
        return StringUtils.hasText(user.getInstitutionName());
    }

    private boolean hasTeamScope(User user) {
        return hasDepartmentScope(user) && StringUtils.hasText(user.getTeamName());
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            sb.append(PASSWORD_CHARS.charAt(random.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String resolveEmployeeEmail(Employee employee) {
        String primaryEmail = normalizeNullable(employee.getEmail());
        if (primaryEmail != null) {
            return primaryEmail.toLowerCase(Locale.ROOT);
        }
        String officialEmail = normalizeNullable(employee.getOfficialEmail());
        if (officialEmail != null) {
            return officialEmail.toLowerCase(Locale.ROOT);
        }
        String personalEmail = normalizeNullable(employee.getPersonalEmail());
        if (personalEmail != null) {
            return personalEmail.toLowerCase(Locale.ROOT);
        }
        return null;
    }

    private String resolveEmployeeBranchName(Employee employee) {
        String institution = normalizeNullable(employee.getInstitution());
        if (institution != null) {
            return institution;
        }
        if (employee.getBranchId() == null) {
            return null;
        }
        return branchMasterRepository.findByIdAndDeletedFalse(employee.getBranchId())
                .map(BranchMaster::getName)
                .map(this::normalizeNullable)
                .orElse(null);
    }

    private String resolveEmployeeDepartmentName(Employee employee) {
        String departmentName = normalizeNullable(employee.getDepartmentName());
        if (departmentName != null) {
            return departmentName;
        }
        if (employee.getDepartmentMasterId() == null) {
            return null;
        }
        return departmentMasterRepository.findByIdAndDeletedFalse(employee.getDepartmentMasterId())
                .map(DepartmentMaster::getName)
                .map(this::normalizeNullable)
                .orElse(null);
    }

    private String resolveEmployeeTeamName(Employee employee) {
        String team = normalizeNullable(employee.getTeam());
        if (team != null) {
            return team;
        }
        if (employee.getDesignationMasterId() == null) {
            return null;
        }
        return designationMasterRepository.findByIdAndDeletedFalse(employee.getDesignationMasterId())
                .map(DesignationMaster::getName)
                .map(this::normalizeNullable)
                .orElse(null);
    }

    private String required(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(message);
        }
        return value.trim();
    }

    private Role parseRequestedRole(CreateUserRequest request) {
        String raw = request.getRole();
        if (!StringUtils.hasText(raw)) {
            return Role.EMPLOYEE;
        }
        String normalized = raw.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        try {
            return Role.valueOf(normalized);
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid role/team: " + raw);
        }
    }

    private UserResponse toUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRole(user.getRole().name());
        response.setActivationStatus(user.getActivationStatus() == null ? null : user.getActivationStatus().name());
        response.setCreatedBy(user.getCreatedBy());
        response.setActive(user.isActive());
        response.setForcePasswordChange(user.isForcePasswordChange());
        response.setCreatedAt(user.getCreatedAt());
        response.setLastLoginAt(user.getLastLoginAt());
        response.setRegisteredIp(user.getRegisteredIp());
        response.setLastActiveIp(user.getLastActiveIp());
        response.setInstitution(user.getInstitutionName());
        response.setDepartmentName(user.getDepartmentName());
        response.setTeam(user.getTeamName());
        response.setEmployeeId(user.getEmployeeId());
        return response;
    }

    private AuditLogResponse toAuditLogResponse(AuditLog log) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(log.getId());
        response.setAction(log.getAction());
        response.setPerformedBy(log.getPerformedBy());
        response.setTargetUser(log.getTargetUser());
        response.setDescription(log.getDescription());
        response.setIpAddress(log.getIpAddress());
        response.setCreatedAt(log.getCreatedAt());
        return response;
    }

    private UserLogResponse toUserLogResponse(AuditLog log) {
        UserLogResponse response = new UserLogResponse();
        response.setId(log.getId());
        response.setUsername(log.getTargetUser());
        response.setEvent(formatEvent(log));
        response.setEventAt(log.getCreatedAt());
        response.setIpAddress(log.getIpAddress());
        return response;
    }

    private UserSessionResponse toUserSessionResponse(User user, RefreshToken token) {
        UserSessionResponse response = new UserSessionResponse();
        response.setId(token.getId());
        response.setUsername(user.getUsername());
        response.setIpAddress(StringUtils.hasText(user.getLastActiveIp()) ? user.getLastActiveIp() : "-");
        response.setPersistent(!token.isRevoked());
        response.setExpiresAt(token.getExpiryDate());
        response.setLastUpdateAt(token.getExpiryDate() == null ? null : token.getExpiryDate().minusDays(REFRESH_TOKEN_DAYS));
        return response;
    }

    private String formatEvent(AuditLog log) {
        String action = log.getAction() == null ? "EVENT" : log.getAction().replace('_', ' ').toLowerCase(Locale.ROOT);
        String prettyAction = action.isEmpty() ? "Event"
                : Character.toUpperCase(action.charAt(0)) + action.substring(1);
        String description = log.getDescription();
        if (StringUtils.hasText(description)) {
            return prettyAction + " - " + description;
        }
        return prettyAction;
    }
}
