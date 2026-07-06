package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Role;
import com.nexorcrm.backend.entity.RoleScopePagePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleScopePagePermissionRepository extends JpaRepository<RoleScopePagePermission, Long> {
    Optional<RoleScopePagePermission> findByRoleAndScopeTypeAndScopeId(Role role, String scopeType, Long scopeId);
    List<RoleScopePagePermission> findByRoleAndScopeType(Role role, String scopeType);
    List<RoleScopePagePermission> findByScopeTypeAndScopeId(String scopeType, Long scopeId);
}
