package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.LeadType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeadTypeRepository extends JpaRepository<LeadType, Long> {
    List<LeadType> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<LeadType> findByIdAndDeletedFalse(Long id);
    boolean existsByTypeNameIgnoreCaseAndDeletedFalse(String typeName);
    boolean existsByTypeNameIgnoreCaseAndDeletedFalseAndIdNot(String typeName, Long id);
}
