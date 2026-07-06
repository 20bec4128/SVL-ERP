package com.nexorcrm.backend.service;

import com.nexorcrm.backend.dto.DepartmentPermissionResponse;
import com.nexorcrm.backend.dto.DesignationPermissionResponse;
import com.nexorcrm.backend.entity.BranchMaster;
import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.RoleScopePagePermission;
import com.nexorcrm.backend.entity.User;
import com.nexorcrm.backend.entity.UserDepartment;
import com.nexorcrm.backend.entity.UserDesignation;
import com.nexorcrm.backend.repo.BranchMasterRepository;
import com.nexorcrm.backend.repo.RoleScopePagePermissionRepository;
import com.nexorcrm.backend.repo.UserDepartmentRepository;
import com.nexorcrm.backend.repo.UserDesignationRepository;
import com.nexorcrm.backend.repo.UserRepository;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class PageAccessService {

    private static final String GLOBAL_SCOPE_TYPE = "GLOBAL";
    private static final String DEPARTMENT_SCOPE_TYPE = "DEPARTMENT";
    private static final String DESIGNATION_SCOPE_TYPE = "DESIGNATION";

    private final RoleScopePagePermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final UserDepartmentRepository userDepartmentRepository;
    private final UserDesignationRepository userDesignationRepository;
    private final BranchMasterRepository branchMasterRepository;

    public PageAccessService(
            RoleScopePagePermissionRepository permissionRepository,
            UserRepository userRepository,
            UserDepartmentRepository userDepartmentRepository,
            UserDesignationRepository userDesignationRepository,
            BranchMasterRepository branchMasterRepository
    ) {
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
        this.userDepartmentRepository = userDepartmentRepository;
        this.userDesignationRepository = userDesignationRepository;
        this.branchMasterRepository = branchMasterRepository;
    }

    @PostConstruct
    public void initializeDefaults() {
        seedDefaultsIfNeeded();
    }

    @Transactional(readOnly = true)
    public List<String> getUserPageKeys(String username) {
        User user = resolveUser(username);
        Role role = user.getRole();
        if (role == Role.SUPER_ADMIN || role == Role.ADMIN) {
            return resolveKeys(role, GLOBAL_SCOPE_TYPE, null);
        }

        if (role == Role.MANAGER) {
            Long departmentId = resolveUserDepartmentScopeId(user);
            if (departmentId == null) {
                return defaultKeys();
            }
            return resolveKeys(role, DEPARTMENT_SCOPE_TYPE, departmentId);
        }

        if (role == Role.TEAM_LEAD || role == Role.EMPLOYEE) {
            Long designationId = resolveUserDesignationScopeId(user);
            if (designationId == null) {
                return defaultKeys();
            }
            return resolveKeys(role, DESIGNATION_SCOPE_TYPE, designationId);
        }

        return defaultKeys();
    }

    @Transactional(readOnly = true)
    public List<DepartmentPermissionResponse> listDepartmentPermissions() {
        Map<Long, String> branchNames = branchMasterRepository.findAll().stream()
                .filter(branch -> branch != null && Boolean.FALSE.equals(branch.getDeleted()))
                .collect(Collectors.toMap(BranchMaster::getId, BranchMaster::getName, (a, b) -> a, LinkedHashMap::new));

        List<UserDepartment> departments = userDepartmentRepository.findAllByOrderByIdDesc();
        return departments.stream()
                .map(department -> {
                    DepartmentPermissionResponse response = new DepartmentPermissionResponse();
                    response.setId(department.getId());
                    response.setName(department.getName());
                    Long branchId = department.getBranch() == null ? null : department.getBranch().getId();
                    response.setBranchId(branchId);
                    response.setBranchName(branchNames.getOrDefault(branchId, ""));
                    response.setPageKeys(resolveKeys(Role.MANAGER, DEPARTMENT_SCOPE_TYPE, department.getId()));
                    return response;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DesignationPermissionResponse> listDesignationPermissions(Role role) {
        Role safeRole = role == null ? Role.EMPLOYEE : role;
        Map<Long, String> departmentNames = userDepartmentRepository.findAllByOrderByIdDesc().stream()
                .collect(Collectors.toMap(UserDepartment::getId, UserDepartment::getName, (a, b) -> a, LinkedHashMap::new));
        List<UserDesignation> designations = userDesignationRepository.findAllByOrderByIdDesc();
        return designations.stream()
                .map(designation -> {
                    Long departmentId = designation.getUserDepartment() == null ? null : designation.getUserDepartment().getId();
                    DesignationPermissionResponse response = new DesignationPermissionResponse();
                    response.setId(designation.getId());
                    response.setName(designation.getName());
                    response.setDepartmentId(departmentId);
                    response.setDepartmentName(departmentNames.getOrDefault(departmentId, ""));
                    response.setPageKeys(resolveKeys(safeRole, DESIGNATION_SCOPE_TYPE, designation.getId()));
                    return response;
                })
                .toList();
    }

    public List<String> saveDepartmentPermissions(Long departmentId, List<String> pageKeys) {
        return savePermissions(Role.MANAGER, DEPARTMENT_SCOPE_TYPE, departmentId, pageKeys);
    }

    public List<String> listGlobalPermissions(Role role) {
        if (role != Role.SUPER_ADMIN && role != Role.ADMIN) {
            throw new IllegalStateException("Global permissions can only be loaded for SUPER_ADMIN or ADMIN");
        }
        return resolveKeys(role, GLOBAL_SCOPE_TYPE, null);
    }

    public List<String> saveGlobalPermissions(Role role, List<String> pageKeys) {
        if (role != Role.SUPER_ADMIN && role != Role.ADMIN) {
            throw new IllegalStateException("Global permissions can only be saved for SUPER_ADMIN or ADMIN");
        }
        return savePermissions(role, GLOBAL_SCOPE_TYPE, null, pageKeys);
    }

    public List<String> saveDesignationPermissions(Role role, Long designationId, List<String> pageKeys) {
        if (role != Role.TEAM_LEAD && role != Role.EMPLOYEE) {
            throw new IllegalStateException("Designation permissions can only be saved for TEAM_LEAD or EMPLOYEE");
        }
        return savePermissions(role, DESIGNATION_SCOPE_TYPE, designationId, pageKeys);
    }

    public void seedDefaultsIfNeeded() {
        seedGlobal(Role.SUPER_ADMIN);
        seedGlobal(Role.ADMIN);
    }

    private void seedGlobal(Role role) {
        List<String> defaults = defaultKeys();
        permissionRepository.findByRoleAndScopeTypeAndScopeId(role, GLOBAL_SCOPE_TYPE, null)
                .ifPresentOrElse(existing -> {
                    // Existing rows may have been edited from the Page Access Matrix.
                }, () -> {
                    RoleScopePagePermission permission = new RoleScopePagePermission();
                    permission.setRole(role);
                    permission.setScopeType(GLOBAL_SCOPE_TYPE);
                    permission.setScopeId(null);
                    permission.setPageKeysCsv(String.join(",", defaults));
                    permissionRepository.save(permission);
                });
    }

    private List<String> savePermissions(Role role, String scopeType, Long scopeId, List<String> pageKeys) {
        if (!GLOBAL_SCOPE_TYPE.equals(scopeType) && scopeId == null) {
            throw new IllegalStateException("Scope id is required");
        }
        List<String> sanitized = sanitizeKeys(pageKeys);
        RoleScopePagePermission permission = permissionRepository
                .findByRoleAndScopeTypeAndScopeId(role, scopeType, scopeId)
                .orElseGet(RoleScopePagePermission::new);
        permission.setRole(role);
        permission.setScopeType(scopeType);
        permission.setScopeId(scopeId);
        permission.setPageKeysCsv(String.join(",", sanitized));
        permissionRepository.save(permission);
        return sanitized;
    }

    private List<String> resolveKeys(Role role, String scopeType, Long scopeId) {
        if (role == null) {
            return defaultKeys();
        }
        return permissionRepository.findByRoleAndScopeTypeAndScopeId(role, scopeType, scopeId)
                .map(this::parseKeys)
                .orElseGet(this::defaultKeys);
    }

    private Long resolveUserDepartmentScopeId(User user) {
        if (user == null || !StringUtils.hasText(user.getInstitutionName()) || !StringUtils.hasText(user.getDepartmentName())) {
            return null;
        }
        BranchMaster branch = branchMasterRepository
                .findFirstByNameIgnoreCaseAndDeletedFalseOrderByIdAsc(user.getInstitutionName().trim())
                .orElse(null);
        if (branch == null || branch.getId() == null) {
            return null;
        }
        return userDepartmentRepository.findByBranchId(branch.getId()).stream()
                .filter(department -> StringUtils.hasText(department.getName()))
                .filter(department -> department.getName().trim().equalsIgnoreCase(user.getDepartmentName().trim()))
                .map(UserDepartment::getId)
                .findFirst()
                .orElse(null);
    }

    private Long resolveUserDesignationScopeId(User user) {
        Long departmentId = resolveUserDepartmentScopeId(user);
        if (departmentId == null || !StringUtils.hasText(user.getTeamName())) {
            return null;
        }
        return userDesignationRepository.findByUserDepartmentId(departmentId).stream()
                .filter(designation -> StringUtils.hasText(designation.getName()))
                .filter(designation -> designation.getName().trim().equalsIgnoreCase(user.getTeamName().trim()))
                .map(UserDesignation::getId)
                .findFirst()
                .orElse(null);
    }

    private List<String> parseKeys(RoleScopePagePermission permission) {
        if (permission == null || !StringUtils.hasText(permission.getPageKeysCsv())) {
            return List.of();
        }
        return Arrays.stream(permission.getPageKeysCsv().split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private List<String> sanitizeKeys(List<String> pageKeys) {
        if (pageKeys == null || pageKeys.isEmpty()) {
            return List.of();
        }
        Set<String> dedup = new LinkedHashSet<>();
        Set<String> allowed = defaultKeys().stream().collect(Collectors.toSet());
        for (String key : pageKeys) {
            String normalized = String.valueOf(key == null ? "" : key).trim().toLowerCase(Locale.ROOT);
            if (StringUtils.hasText(normalized) && allowed.contains(normalized)) {
                dedup.add(normalized);
            }
        }
        return new ArrayList<>(dedup);
    }

    private List<String> defaultKeys() {
        return UserGroupService.DEFAULT_PAGE_KEYS.stream()
                .map(key -> String.valueOf(key).trim().toLowerCase(Locale.ROOT))
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
    }

    private User resolveUser(String username) {
        if (!StringUtils.hasText(username)) {
            throw new AccessDeniedException("Unauthenticated actor");
        }
        String normalized = username.trim();
        return normalized.contains("@")
                ? userRepository.findByEmailAndIsDeletedFalse(normalized.toLowerCase(Locale.ROOT))
                        .orElseThrow(() -> new EntityNotFoundException("User not found"))
                : userRepository.findByUsernameAndIsDeletedFalse(normalized)
                        .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

}
