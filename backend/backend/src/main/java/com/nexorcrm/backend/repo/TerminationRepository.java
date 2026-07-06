package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Termination;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TerminationRepository extends JpaRepository<Termination, Long> {
    List<Termination> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<Termination> findByIdAndDeletedFalse(Long id);
}
