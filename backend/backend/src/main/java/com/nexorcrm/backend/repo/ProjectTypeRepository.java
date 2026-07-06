package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.ProjectType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectTypeRepository extends JpaRepository<ProjectType, Long> {
    List<ProjectType> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<ProjectType> findByIdAndDeletedFalse(Long id);
    boolean existsByTypeNameIgnoreCaseAndDeletedFalse(String typeName);
    boolean existsByTypeNameIgnoreCaseAndDeletedFalseAndIdNot(String typeName, Long id);
}
