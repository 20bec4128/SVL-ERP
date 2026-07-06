package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Resignation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResignationRepository extends JpaRepository<Resignation, Long> {
    List<Resignation> findByDeletedFalseOrderByCreatedAtDesc();
    Optional<Resignation> findByIdAndDeletedFalse(Long id);
    List<Resignation> findByDeletedFalseAndResignationDateLessThanEqual(java.time.LocalDate date);
}
