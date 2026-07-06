package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<Project> findByIdAndDeletedFalse(Long id);
    boolean existsByProjectNameIgnoreCaseAndDeletedFalse(String projectName);
    boolean existsByProjectNameIgnoreCaseAndDeletedFalseAndIdNot(String projectName, Long id);
}
