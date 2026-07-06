package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.CustomFieldOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomFieldOptionRepository extends JpaRepository<CustomFieldOption, Long> {

    @Query("SELECT c FROM CustomFieldOption c WHERE c.typeId = :typeId " +
           "AND (:subtypeId IS NULL AND c.subtypeId IS NULL OR c.subtypeId = :subtypeId) " +
           "AND c.fieldKey = :fieldKey ORDER BY c.createdAt DESC")
    List<CustomFieldOption> findByScope(
        @Param("typeId") Long typeId,
        @Param("subtypeId") Long subtypeId,
        @Param("fieldKey") String fieldKey
    );

    @Query("SELECT c FROM CustomFieldOption c WHERE c.typeId = :typeId " +
           "AND (:subtypeId IS NULL AND c.subtypeId IS NULL OR c.subtypeId = :subtypeId) " +
           "AND c.fieldKey = :fieldKey AND c.valueNorm = :valueNorm")
    Optional<CustomFieldOption> findExisting(
        @Param("typeId") Long typeId,
        @Param("subtypeId") Long subtypeId,
        @Param("fieldKey") String fieldKey,
        @Param("valueNorm") String valueNorm
    );
}
