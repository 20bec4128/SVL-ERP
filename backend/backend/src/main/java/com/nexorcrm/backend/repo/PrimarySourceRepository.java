package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.PrimarySource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrimarySourceRepository extends JpaRepository<PrimarySource, Long> {
    List<PrimarySource> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<PrimarySource> findByIdAndDeletedFalse(Long id);
    Optional<PrimarySource> findBySourceNameIgnoreCaseAndDeletedFalse(String sourceName);
    boolean existsBySourceNameIgnoreCaseAndDeletedFalse(String sourceName);
    boolean existsBySourceNameIgnoreCaseAndDeletedFalseAndIdNot(String sourceName, Long id);
}
