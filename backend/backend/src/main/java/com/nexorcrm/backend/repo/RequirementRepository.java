package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.Requirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequirementRepository extends JpaRepository<Requirement, Long> {
    List<Requirement> findByLeadIdOrderByCreatedAtDesc(Long leadId);
    boolean existsByLeadId(Long leadId);
}
