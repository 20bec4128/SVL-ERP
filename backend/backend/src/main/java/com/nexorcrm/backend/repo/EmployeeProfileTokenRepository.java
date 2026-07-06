package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.EmployeeProfileToken;
import com.nexorcrm.backend.entity.EmployeeTokenScope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EmployeeProfileTokenRepository extends JpaRepository<EmployeeProfileToken, Long> {

    Optional<EmployeeProfileToken> findFirstByTokenHash(String tokenHash);

    boolean existsByEmployeeId(Long employeeId);

    boolean existsByEmployeeIdAndScope(Long employeeId, EmployeeTokenScope scope);

    Optional<EmployeeProfileToken> findTopByEmployeeIdAndScopeAndRevokedAtIsNullAndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
            Long employeeId,
            EmployeeTokenScope scope,
            LocalDateTime now
    );

    @Query("""
            select t
            from EmployeeProfileToken t
            where t.employeeId in :employeeIds
              and t.scope = :scope
              and t.revokedAt is null
              and t.usedAt is null
              and t.expiresAt > :now
              and t.createdAt = (
                select max(t2.createdAt)
                from EmployeeProfileToken t2
                where t2.employeeId = t.employeeId
                  and t2.scope = :scope
                  and t2.revokedAt is null
                  and t2.usedAt is null
                  and t2.expiresAt > :now
              )
            """)
    List<EmployeeProfileToken> findActiveUnusedLatestTokensForEmployees(
            @Param("employeeIds") Collection<Long> employeeIds,
            @Param("scope") EmployeeTokenScope scope,
            @Param("now") LocalDateTime now
    );

    @Modifying
    @Query("""
            update EmployeeProfileToken t
            set t.revokedAt = :revokedAt
            where t.employeeId = :employeeId
              and t.revokedAt is null
              and t.expiresAt > :revokedAt
            """)
    int revokeActiveTokens(@Param("employeeId") Long employeeId, @Param("revokedAt") LocalDateTime revokedAt);
}
