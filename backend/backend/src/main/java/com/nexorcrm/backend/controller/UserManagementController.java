package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.CreateUserRequest;
import com.nexorcrm.backend.dto.UpdateUserProfileRequest;
import com.nexorcrm.backend.dto.ApiMessageResponse;
import com.nexorcrm.backend.dto.AuditLogResponse;
import com.nexorcrm.backend.dto.UserLogResponse;
import com.nexorcrm.backend.dto.UserResponse;
import com.nexorcrm.backend.dto.UserSessionResponse;
import com.nexorcrm.backend.dto.UserGroupSummaryResponse;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.service.SuperAdminService;
import com.nexorcrm.backend.service.UserGroupService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserManagementController {

    private final SuperAdminService superAdminService;
    private final UserGroupService userGroupService;

    public UserManagementController(SuperAdminService superAdminService,
                                    UserGroupService userGroupService) {
        this.superAdminService = superAdminService;
        this.userGroupService = userGroupService;
    }

    @GetMapping
    public Page<UserResponse> getUsers(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "10") int size,
                                       Authentication authentication) {
        Pageable pageable = PageRequest.of(page, size);
        return superAdminService.getVisibleUsers(pageable, authentication.getName());
    }

    @PostMapping
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request, Authentication authentication) {
        return superAdminService.createPendingUser(request, authentication.getName());
    }

    @GetMapping("/pending")
    public Page<UserResponse> getPendingUsers(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size,
                                              Authentication authentication) {
        Pageable pageable = PageRequest.of(page, size);
        return superAdminService.getPendingUsers(pageable, authentication.getName());
    }

    @PutMapping("/{id}/profile")
    public UserResponse updateProfile(@PathVariable("id") Long id,
                                      @Valid @RequestBody UpdateUserProfileRequest request,
                                      Authentication authentication) {
        return superAdminService.updateUserProfile(id, request, authentication.getName());
    }

    @PatchMapping("/{id}/role")
    public UserResponse updateRole(@PathVariable("id") Long id,
                                   @RequestParam("role") String role,
                                   Authentication authentication) {
        Role parsedRole = parseRole(role);
        return superAdminService.updateUserRole(id, parsedRole, authentication.getName());
    }

    @PatchMapping("/{id}/status")
    public UserResponse updateStatus(@PathVariable("id") Long id,
                                     @RequestParam("active") boolean active,
                                     Authentication authentication) {
        return superAdminService.updateUserStatus(id, active, authentication.getName());
    }

    @PatchMapping("/{id}/delete")
    public void deleteUser(@PathVariable("id") Long id, Authentication authentication) {
        superAdminService.deleteUser(id, authentication.getName());
    }

    @GetMapping("/{id}/logs")
    public List<UserLogResponse> getUserLogs(@PathVariable("id") Long id, Authentication authentication) {
        return superAdminService.getUserLogs(id, authentication.getName());
    }

    @GetMapping("/{id}/sessions")
    public List<UserSessionResponse> getUserSessions(@PathVariable("id") Long id, Authentication authentication) {
        return superAdminService.getUserSessions(id, authentication.getName());
    }

    @GetMapping("/{id}/groups")
    public List<UserGroupSummaryResponse> getUserGroups(@PathVariable("id") Long id, Authentication authentication) {
        return userGroupService.listGroupsForUser(id, authentication.getName());
    }

    @PatchMapping("/{id}/sessions/delete")
    public void deleteUserSessions(@PathVariable("id") Long id,
                                   @RequestBody List<Long> sessionIds,
                                   Authentication authentication) {
        superAdminService.deleteUserSessions(id, sessionIds, authentication.getName());
    }

    @GetMapping("/audit-logs")
    public Page<AuditLogResponse> getAuditLogs(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size,
                                               Authentication authentication) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return superAdminService.getAuditLogsForActor(pageable, authentication.getName());
    }

    @DeleteMapping("/audit-logs")
    public ApiMessageResponse deleteAllAuditLogs(Authentication authentication) {
        long deleted = superAdminService.deleteAllAuditLogs(authentication.getName());
        return new ApiMessageResponse("Deleted " + deleted + " log(s)");
    }

    @DeleteMapping("/audit-logs/older-than")
    public ApiMessageResponse deleteAuditLogsOlderThan(@RequestParam(defaultValue = "30") int days,
                                                       Authentication authentication) {
        long deleted = superAdminService.deleteAuditLogsOlderThanDays(days, authentication.getName());
        return new ApiMessageResponse("Deleted " + deleted + " log(s)");
    }

    private Role parseRole(String value) {
        try {
            return Role.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid role: " + value);
        }
    }
}
