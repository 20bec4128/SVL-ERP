package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.AuditLog;
import com.nexorcrm.backend.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop100ByTargetUserIgnoreCaseOrderByCreatedAtDesc(String targetUser);

    @Query(
            value = """
                    SELECT a FROM AuditLog a
                    WHERE lower(coalesce(a.performedBy, '')) IN :actorIds
                       OR lower(coalesce(a.targetUser, '')) IN :actorIds
                    ORDER BY a.createdAt DESC
                    """,
            countQuery = """
                    SELECT COUNT(a) FROM AuditLog a
                    WHERE lower(coalesce(a.performedBy, '')) IN :actorIds
                       OR lower(coalesce(a.targetUser, '')) IN :actorIds
                    """
    )
    Page<AuditLog> findVisibleForActorIds(
            @Param("actorIds") List<String> actorIds,
            Pageable pageable
    );

    @Query(
            value = """
                    SELECT a FROM AuditLog a
                    WHERE (
                        EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.performedBy)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                        )
                        OR EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.targetUser)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                        )
                    )
                    ORDER BY a.createdAt DESC
                    """,
            countQuery = """
                    SELECT COUNT(a) FROM AuditLog a
                    WHERE (
                        EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.performedBy)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                        )
                        OR EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.targetUser)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                        )
                    )
                    """
    )
    Page<AuditLog> findVisibleForDepartmentScope(
            @Param("roles") List<Role> roles,
            @Param("institutionName") String institutionName,
            @Param("departmentName") String departmentName,
            Pageable pageable
    );

    @Query(
            value = """
                    SELECT a FROM AuditLog a
                    WHERE (
                        EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.performedBy)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                        )
                        OR EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.targetUser)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                        )
                        OR lower(coalesce(a.performedBy, '')) IN :actorIds
                        OR lower(coalesce(a.targetUser, '')) IN :actorIds
                    )
                    ORDER BY a.createdAt DESC
                    """,
            countQuery = """
                    SELECT COUNT(a) FROM AuditLog a
                    WHERE (
                        EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.performedBy)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                        )
                        OR EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.targetUser)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                        )
                        OR lower(coalesce(a.performedBy, '')) IN :actorIds
                        OR lower(coalesce(a.targetUser, '')) IN :actorIds
                    )
                    """
    )
    Page<AuditLog> findVisibleForDepartmentScopeWithActor(
            @Param("roles") List<Role> roles,
            @Param("institutionName") String institutionName,
            @Param("departmentName") String departmentName,
            @Param("actorIds") List<String> actorIds,
            Pageable pageable
    );

    @Query(
            value = """
                    SELECT a FROM AuditLog a
                    WHERE (
                        EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.performedBy)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                              AND lower(coalesce(u.teamName, '')) = lower(:teamName)
                        )
                        OR EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.targetUser)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                              AND lower(coalesce(u.teamName, '')) = lower(:teamName)
                        )
                    )
                    ORDER BY a.createdAt DESC
                    """,
            countQuery = """
                    SELECT COUNT(a) FROM AuditLog a
                    WHERE (
                        EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.performedBy)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                              AND lower(coalesce(u.teamName, '')) = lower(:teamName)
                        )
                        OR EXISTS (
                            SELECT u.id FROM User u
                            WHERE u.isDeleted = false
                              AND lower(u.email) = lower(a.targetUser)
                              AND u.role IN :roles
                              AND lower(coalesce(u.institutionName, '')) = lower(:institutionName)
                              AND lower(coalesce(u.departmentName, '')) = lower(:departmentName)
                              AND lower(coalesce(u.teamName, '')) = lower(:teamName)
                        )
                    )
                    """
    )
    Page<AuditLog> findVisibleForTeamScope(
            @Param("roles") List<Role> roles,
            @Param("institutionName") String institutionName,
            @Param("departmentName") String departmentName,
            @Param("teamName") String teamName,
            Pageable pageable
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from AuditLog a where a.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
