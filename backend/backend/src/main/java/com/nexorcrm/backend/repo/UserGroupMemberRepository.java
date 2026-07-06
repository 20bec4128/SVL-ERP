package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.UserGroup;
import com.nexorcrm.backend.entity.UserGroupMember;
import com.nexorcrm.backend.entity.ActivationStatus;
import com.nexorcrm.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface UserGroupMemberRepository extends JpaRepository<UserGroupMember, Long> {
    List<UserGroupMember> findByGroupOrderByUserUsernameAsc(UserGroup group);

    long countByGroup(UserGroup group);

    boolean existsByGroupAndUserId(UserGroup group, Long userId);

    Optional<UserGroupMember> findByGroupAndUserId(UserGroup group, Long userId);

    List<UserGroupMember> findByUser_IdOrderByIdAsc(Long userId);

    List<UserGroupMember> findByGroup_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalseOrderByUserUsernameAsc(
            Long groupId,
            Role role,
            ActivationStatus activationStatus
    );

    List<UserGroupMember> findByGroup_IdAndUser_IdAndUser_RoleAndUser_ActivationStatusAndUser_ActiveTrueAndUser_IsDeletedFalse(
            Long groupId,
            Long userId,
            Role role,
            ActivationStatus activationStatus
    );

    @Transactional
    void deleteByGroupAndUserId(UserGroup group, Long userId);
}
