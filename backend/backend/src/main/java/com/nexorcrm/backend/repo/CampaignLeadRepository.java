package com.nexorcrm.backend.repo;

import com.nexorcrm.backend.entity.CampaignLead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignLeadRepository extends JpaRepository<CampaignLead, Long> {
    Optional<CampaignLead> findByLeadId(String leadId);
    List<CampaignLead> findByLeadStatus(String leadStatus);
}
