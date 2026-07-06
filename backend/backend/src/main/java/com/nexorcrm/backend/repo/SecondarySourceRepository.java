package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.SecondarySource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SecondarySourceRepository extends JpaRepository<SecondarySource, Long> {
    List<SecondarySource> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<SecondarySource> findByIdAndDeletedFalse(Long id);
    Optional<SecondarySource> findBySourceNameIgnoreCaseAndDeletedFalse(String sourceName);
    boolean existsBySourceNameIgnoreCaseAndDeletedFalse(String sourceName);
    boolean existsBySourceNameIgnoreCaseAndDeletedFalseAndIdNot(String sourceName, Long id);
}
