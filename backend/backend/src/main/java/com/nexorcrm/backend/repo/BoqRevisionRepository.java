package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.BoqRevision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoqRevisionRepository extends JpaRepository<BoqRevision, Long> {
    List<BoqRevision> findByLead_IdOrderByCreatedAtDesc(Long leadId);
}
