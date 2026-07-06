package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Training;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrainingRepository extends JpaRepository<Training, Long> {
    List<Training> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<Training> findByIdAndDeletedFalse(Long id);
}
