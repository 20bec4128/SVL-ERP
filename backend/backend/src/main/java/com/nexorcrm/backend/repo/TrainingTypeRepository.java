package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.TrainingType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrainingTypeRepository extends JpaRepository<TrainingType, Long> {
    List<TrainingType> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<TrainingType> findByIdAndDeletedFalse(Long id);
    boolean existsByTypeNameIgnoreCaseAndDeletedFalse(String typeName);
    boolean existsByTypeNameIgnoreCaseAndDeletedFalseAndIdNot(String typeName, Long id);
}
