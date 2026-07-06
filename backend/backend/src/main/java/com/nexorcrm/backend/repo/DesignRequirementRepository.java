package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.DesignRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DesignRequirementRepository extends JpaRepository<DesignRequirement, Long> {
    Optional<DesignRequirement> findByLeadId(Long leadId);
    boolean existsByLeadId(Long leadId);
}
