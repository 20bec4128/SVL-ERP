package com.nexorcrm.backend.security;

import com.nexorcrm.backend.entity.Role;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class RolePermissionUtil {

    private static final Map<Role, Integer> HIERARCHY = new EnumMap<>(Role.class);

    static {
        HIERARCHY.put(Role.SUPER_ADMIN, 4);
        HIERARCHY.put(Role.ADMIN, 3);
        HIERARCHY.put(Role.MANAGER, 2);
        HIERARCHY.put(Role.TEAM_LEAD, 1);
        HIERARCHY.put(Role.EMPLOYEE, 0);
        HIERARCHY.put(Role.CUSTOMER, 0);
    }

    private RolePermissionUtil() {
    }

    public static boolean isStrictlyHigher(Role actorRole, Role targetRole) {
        return rank(actorRole) > rank(targetRole);
    }

    public static boolean isEqualOrHigher(Role actorRole, Role targetRole) {
        return rank(actorRole) >= rank(targetRole);
    }

    public static boolean canEdit(Role actorRole, Long actorUserId, Role targetRole, Long targetUserId) {
        if (actorUserId != null && targetUserId != null && actorUserId.equals(targetUserId)) {
            return true;
        }
        return isStrictlyHigher(actorRole, targetRole);
    }

    public static boolean canAssign(Role actorRole, Role roleToAssign) {
        if (roleToAssign == Role.SUPER_ADMIN) {
            return false;
        }
        if (roleToAssign == Role.CUSTOMER) {
            return true;
        }
        return isStrictlyHigher(actorRole, roleToAssign);
    }

    public static boolean canSeeInManagementList(Role actorRole, Role targetRole) {
        if (targetRole == Role.CUSTOMER) {
            return true;
        }
        return isEqualOrHigher(actorRole, targetRole);
    }

    public static List<Role> getVisibleRoles(Role actorRole) {
        return Arrays.stream(Role.values())
                .filter(role -> canSeeInManagementList(actorRole, role))
                .collect(Collectors.toList());
    }

    public static List<Role> getAssignableRoles(Role actorRole) {
        return Arrays.stream(Role.values())
                .filter(role -> canAssign(actorRole, role))
                .collect(Collectors.toList());
    }

    private static int rank(Role role) {
        if (role == null) {
            throw new IllegalArgumentException("Role cannot be null");
        }
        Integer rank = HIERARCHY.get(role);
        if (rank == null) {
            throw new IllegalArgumentException("Unknown role: " + role);
        }
        return rank;
    }
}
