package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.AuditLogResponse;
import com.nexorcrm.backend.dto.CreateUserRequest;
import com.nexorcrm.backend.dto.ResetPasswordResponse;
import com.nexorcrm.backend.dto.UserResponse;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.service.SuperAdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/superadmin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
    }

    @PostMapping("/create-admin")
    public UserResponse createAdmin(@Valid @RequestBody CreateUserRequest request) {
        return superAdminService.createAdmin(request);
    }

    @GetMapping("/users")
    public Page<UserResponse> getUsers(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "10") int size,
                                       Authentication authentication) {
        Pageable pageable = PageRequest.of(page, size);
        return superAdminService.getVisibleUsers(pageable, authentication.getName());
    }

    @PatchMapping("/users/{id}/status")
    public UserResponse updateStatus(@PathVariable("id") Long id,
                                     @RequestParam("active") boolean active,
                                     Authentication authentication) {
        return superAdminService.updateUserStatus(id, active, authentication.getName());
    }

    @PatchMapping("/users/{id}/role")
    public UserResponse updateRole(@PathVariable("id") Long id,
                                   @RequestParam("role") String role,
                                   Authentication authentication) {
        Role parsedRole = Role.valueOf(role.toUpperCase());
        return superAdminService.updateUserRole(id, parsedRole, authentication.getName());
    }

    @PostMapping("/users/{id}/reset-password")
    public ResetPasswordResponse resetPassword(@PathVariable("id") Long id, Authentication authentication) {
        return superAdminService.resetUserPassword(id, authentication.getName());
    }

    @GetMapping("/audit-logs")
    public Page<AuditLogResponse> getAuditLogs(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return superAdminService.getAuditLogs(pageable);
    }
}
