package com.nexorcrm.backend.controller;

import com.nexorcrm.backend.dto.DepartmentPermissionResponse;
import com.nexorcrm.backend.dto.DesignationPermissionResponse;
import com.nexorcrm.backend.dto.PageAccessSaveRequest;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.service.PageAccessService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/page-access")
public class PageAccessController {

    private final PageAccessService pageAccessService;

    public PageAccessController(PageAccessService pageAccessService) {
        this.pageAccessService = pageAccessService;
    }

    @GetMapping("/my-keys")
    public List<String> getMyKeys(Authentication authentication) {
        return pageAccessService.getUserPageKeys(authentication.getName());
    }

    @GetMapping("/departments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<DepartmentPermissionResponse> getDepartmentPermissions() {
        return pageAccessService.listDepartmentPermissions();
    }

    @GetMapping("/global")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<String> getGlobalPermissions(@RequestParam("role") String role) {
        return pageAccessService.listGlobalPermissions(parseRole(role));
    }

    @PutMapping("/global")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<String> saveGlobalPermissions(@RequestParam("role") String role,
                                              @RequestBody PageAccessSaveRequest request) {
        return pageAccessService.saveGlobalPermissions(parseRole(role), request == null ? null : request.getPageKeys());
    }

    @PutMapping("/departments/{departmentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<String> saveDepartmentPermissions(@PathVariable Long departmentId,
                                                  @RequestBody PageAccessSaveRequest request) {
        return pageAccessService.saveDepartmentPermissions(departmentId, request == null ? null : request.getPageKeys());
    }

    @GetMapping("/designations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<DesignationPermissionResponse> getDesignationPermissions(@RequestParam("role") String role) {
        return pageAccessService.listDesignationPermissions(parseRole(role));
    }

    @PutMapping("/designations/{designationId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public List<String> saveDesignationPermissions(@PathVariable Long designationId,
                                                   @RequestParam("role") String role,
                                                   @RequestBody PageAccessSaveRequest request) {
        return pageAccessService.saveDesignationPermissions(parseRole(role), designationId, request == null ? null : request.getPageKeys());
    }

    @PostMapping("/seed-defaults")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void seedDefaults() {
        pageAccessService.seedDefaultsIfNeeded();
    }

    private Role parseRole(String value) {
        try {
            return Role.valueOf(String.valueOf(value).trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid role: " + value);
        }
    }
}
