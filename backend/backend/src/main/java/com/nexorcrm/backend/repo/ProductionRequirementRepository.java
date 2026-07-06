package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.ProductionRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductionRequirementRepository extends JpaRepository<ProductionRequirement, Long> {
    Optional<ProductionRequirement> findByLeadId(Long leadId);

    boolean existsByLeadId(Long leadId);
}
