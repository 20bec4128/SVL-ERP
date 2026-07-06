package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Trainer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrainerRepository extends JpaRepository<Trainer, Long> {
    List<Trainer> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<Trainer> findByIdAndDeletedFalse(Long id);
}
