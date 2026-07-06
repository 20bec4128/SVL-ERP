package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.TertiarySource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TertiarySourceRepository extends JpaRepository<TertiarySource, Long> {
    List<TertiarySource> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<TertiarySource> findByIdAndDeletedFalse(Long id);
    boolean existsBySourceNameIgnoreCaseAndDeletedFalse(String sourceName);
    boolean existsBySourceNameIgnoreCaseAndDeletedFalseAndIdNot(String sourceName, Long id);
}
