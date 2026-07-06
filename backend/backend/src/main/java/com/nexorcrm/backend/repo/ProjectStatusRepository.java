package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectStatusRepository extends JpaRepository<ProjectStatus, Long> {
    List<ProjectStatus> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<ProjectStatus> findByIdAndDeletedFalse(Long id);
    boolean existsByStatusNameIgnoreCaseAndDeletedFalse(String statusName);
    boolean existsByStatusNameIgnoreCaseAndDeletedFalseAndIdNot(String statusName, Long id);
}
